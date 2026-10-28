import { describe, expect, it } from "@effect/vitest";
import { Duration, Effect, Fiber, Layer } from "effect";
import { TestClock } from "effect/testing";
import { AuthClient } from "../../src/auth.ts";
import { webUntisLayer } from "../../src/client.ts";
import type { WebUntisConnection } from "../../src/internal/connection.ts";
import {
  ConfigurationError,
  InvalidCredentials,
  PermissionDenied,
  RateLimited,
  TransportError,
  UpstreamRejected,
} from "../../src/internal/errors.ts";
import { WebUntisHttp } from "../../src/internal/http.ts";
import type { ConnectionLimits } from "../../src/internal/transport.ts";
import {
  jsonResponse,
  makeCoreTestLayer,
  makeJwt,
  mockHttpLayer,
  testConnection,
  testGet,
  testSchoolTarget,
} from "./helpers.ts";

interface Calls {
  logins: number;
  tokens: number;
  reads: number;
}

/**
 * A WebUntis that logs in normally and answers every REST read with `read`.
 * `token` decides what the token endpoint returns after a login.
 */
const webUntis = (
  calls: Calls,
  read: (call: number) => Response | Promise<Response>,
  token: () => Response = () => new Response(makeJwt(), { status: 200 }),
) =>
  makeCoreTestLayer(
    (request) => {
      const { pathname } = new URL(request.url);
      if (pathname.endsWith("/index.do")) {
        return new Response("", { status: 200 });
      }
      if (pathname.endsWith("/j_spring_security_check")) {
        calls.logins += 1;
        return new Response("", { status: 302, headers: { location: "/WebUntis/index.do" } });
      }
      if (pathname.endsWith("/api/token/new")) {
        calls.tokens += 1;
        return token();
      }
      calls.reads += 1;
      return read(calls.reads);
    },
    { ...testConnection, school: { ...testSchoolTarget, tenantId: "tenant-42" } },
  );

const read = Effect.gen(function* () {
  const http = yield* WebUntisHttp;
  return yield* testGet(http, "api/rest/view/v1/test", { policy: "auth-only" });
});

const newCalls = (): Calls => ({ logins: 0, tokens: 0, reads: 0 });

/**
 * Lets the mock transport's promises settle in real time, so assertions after
 * `TestClock.adjust` see every request the adjusted clock released.
 */
const settle = Effect.promise(() => new Promise((resolve) => setTimeout(resolve, 20)));

const advance = (duration: Duration.Input) =>
  Effect.andThen(settle, TestClock.adjust(duration)).pipe(Effect.andThen(settle));

describe("typed failures", () => {
  it.effect("reports a refused password once and stops logging in until refreshed", () => {
    const calls = newCalls();

    return Effect.gen(function* () {
      const auth = yield* AuthClient;
      const first = yield* Effect.flip(read);
      const second = yield* Effect.flip(read);

      expect(first).toBeInstanceOf(InvalidCredentials);
      expect(second).toBe(first);
      expect(calls.logins).toBe(1);

      yield* Effect.flip(auth.refresh);
      expect(calls.logins).toBe(2);
    }).pipe(
      Effect.provide(
        webUntis(
          calls,
          () => jsonResponse({}),
          () => new Response("", { status: 302, headers: { location: "/WebUntis/index.do" } }),
        ),
      ),
    );
  });

  it.effect("reports a 403 as PermissionDenied without logging in again", () => {
    const calls = newCalls();

    return Effect.gen(function* () {
      const denied = yield* Effect.flip(read);
      yield* read;

      expect(denied).toBeInstanceOf(PermissionDenied);
      expect(denied).toMatchObject({ errorCode: "FORBIDDEN" });
      expect(calls.logins).toBe(1);
      expect(calls.reads).toBe(2);
    }).pipe(
      Effect.provide(
        webUntis(calls, (call) =>
          call === 1
            ? new Response(JSON.stringify({ errorCode: "FORBIDDEN", errorMessage: "Access" }), {
                status: 403,
              })
            : jsonResponse({}),
        ),
      ),
    );
  });

  it.effect("parses the WebUntis errorCode of a rejected request", () => {
    const calls = newCalls();

    return Effect.gen(function* () {
      const rejected = yield* Effect.flip(read);
      const unexplained = yield* Effect.flip(read);

      expect(rejected).toBeInstanceOf(UpstreamRejected);
      expect(rejected).toMatchObject({ status: 404, errorCode: "NOT_FOUND" });
      expect(unexplained).toBeInstanceOf(TransportError);
      expect(unexplained).toMatchObject({ status: 404, body: "<html>gone</html>" });
    }).pipe(
      Effect.provide(
        webUntis(calls, (call) =>
          call === 1
            ? new Response(JSON.stringify({ errorCode: "NOT_FOUND" }), { status: 404 })
            : new Response("<html>gone</html>", { status: 404 }),
        ),
      ),
    );
  });

  it.effect("waits as long as Retry-After asks, then reports RateLimited", () => {
    const calls = newCalls();

    return Effect.gen(function* () {
      const fiber = yield* Effect.flip(read).pipe(Effect.forkChild);

      // Two retries, each waiting the 30 seconds WebUntis asked for.
      yield* advance("29 seconds");
      expect(calls.reads).toBe(1);
      yield* advance("2 seconds");
      expect(calls.reads).toBe(2);
      yield* advance("30 seconds");
      const error = yield* Fiber.join(fiber);

      expect(calls.reads).toBe(3);
      expect(error).toBeInstanceOf(RateLimited);
      if (error instanceof RateLimited) {
        expect(error.retryAfter).toEqual(Duration.seconds(30));
      }
    }).pipe(
      Effect.provide(
        webUntis(calls, () => new Response("", { status: 429, headers: { "retry-after": "30" } })),
      ),
    );
  });
});

describe("connection limits", () => {
  const limited = (limits: ConnectionLimits, onRead: () => Promise<Response>) =>
    makeCoreTestLayer(
      (request) => {
        const { pathname } = new URL(request.url);
        if (pathname.endsWith("/j_spring_security_check")) {
          return new Response("", { status: 302 });
        }
        if (pathname.endsWith("/api/token/new")) {
          return new Response(makeJwt(), { status: 200 });
        }
        if (pathname.endsWith("/app/data")) {
          return jsonResponse({ currentSchoolYear: null, tenant: { id: "tenant-42" } });
        }
        if (pathname.endsWith("/index.do")) {
          return new Response("", { status: 200 });
        }
        return onRead();
      },
      { ...testConnection, limits },
    );

  it.effect("keeps at most `concurrency` requests in flight", () => {
    let inFlight = 0;
    let peak = 0;

    return Effect.gen(function* () {
      const http = yield* WebUntisHttp;
      yield* Effect.all(
        Array.from({ length: 6 }, () => testGet(http, "api/rest/view/v1/test")),
        { concurrency: "unbounded" },
      );

      expect(peak).toBe(2);
    }).pipe(
      Effect.provide(
        limited({ concurrency: 2 }, async () => {
          inFlight += 1;
          peak = Math.max(peak, inFlight);
          await new Promise((resolve) => setTimeout(resolve, 5));
          inFlight -= 1;
          return jsonResponse({});
        }),
      ),
      TestClock.withLive,
    );
  });

  it.effect("spends at most `budget.requests` per window and makes the rest wait", () => {
    let reads = 0;

    return Effect.gen(function* () {
      const http = yield* WebUntisHttp;
      // Logging in spends 4 of the 6 requests: index.do, login, token, app/data.
      const fiber = yield* Effect.all(
        Array.from({ length: 4 }, () => testGet(http, "api/rest/view/v1/test")),
        { concurrency: "unbounded" },
      ).pipe(Effect.forkChild);

      // The bucket refills one request every 10 seconds.
      yield* advance("1 second");
      expect(reads).toBe(2);
      yield* advance("10 seconds");
      expect(reads).toBe(3);
      yield* advance("10 seconds");
      expect(reads).toBe(4);
      yield* Fiber.join(fiber);
    }).pipe(
      Effect.provide(
        limited({ budget: { requests: 6, window: "1 minute" } }, () => {
          reads += 1;
          return Promise.resolve(jsonResponse({}));
        }),
      ),
    );
  });

  it.effect("rejects limits that cannot work", () =>
    Effect.gen(function* () {
      const invalid: ReadonlyArray<ConnectionLimits> = [
        { concurrency: 0 },
        { concurrency: 1.5 },
        { budget: { requests: 0, window: "1 minute" } },
        { budget: { requests: 10, window: "0 millis" } },
      ];
      for (const limits of invalid) {
        const connection: WebUntisConnection = { ...testConnection, limits };
        const error = yield* Effect.flip(
          Layer.build(webUntisLayer(connection)).pipe(
            Effect.provide(mockHttpLayer(() => new Response())),
          ),
        );
        expect(error).toBeInstanceOf(ConfigurationError);
      }
    }),
  );
});
