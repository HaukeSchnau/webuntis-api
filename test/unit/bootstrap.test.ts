import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { TestClock } from "effect/testing";
import { AuthClient } from "../../src/auth.ts";
import { AuthError, DecodeError } from "../../src/internal/errors.ts";
import { WebUntisHttp } from "../../src/internal/http.ts";
import { RequestPolicy } from "../../src/internal/request.ts";
import {
  jsonResponse,
  makeCoreTestLayer,
  makeJwt,
  makeJwtWithoutExpiry,
  testConfig,
  testGet,
  testGetSchema,
} from "./helpers.ts";

describe("bootstrap and transport", () => {
  it.effect(
    "deduplicates concurrent authentication refreshes",
    () => {
      let seedCalls = 0;
      let loginCalls = 0;
      let tokenCalls = 0;

      return Effect.gen(function* () {
        const auth = yield* AuthClient;
        yield* Effect.all([auth.ensureAuthenticated, auth.ensureAuthenticated], {
          concurrency: "unbounded",
        });

        expect(seedCalls).toBe(1);
        expect(loginCalls).toBe(1);
        expect(tokenCalls).toBe(1);
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              seedCalls += 1;
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              loginCalls += 1;
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              tokenCalls += 1;
              return new Response(makeJwt(), { status: 200 });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "hydrates tenant and school-year headers automatically",
    () => {
      const finalHeaders: Array<Readonly<Record<string, string>>> = [];

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* testGet(http, "api/rest/view/v1/messages/status");

        expect(finalHeaders).toHaveLength(1);
        expect(finalHeaders[0]?.["authorization"]).toContain("Bearer ");
        expect(finalHeaders[0]?.["cookie"]).toContain("JSESSIONID=login");
        expect(finalHeaders[0]?.["Tenant-Id"] ?? finalHeaders[0]?.["tenant-id"]).toBe("tenant-42");
        expect(
          finalHeaders[0]?.["X-Webuntis-Api-School-Year-Id"] ??
            finalHeaders[0]?.["x-webuntis-api-school-year-id"],
        ).toBe("7");
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              return new Response(makeJwt(), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              return jsonResponse({
                currentSchoolYear: { id: 7 },
                tenant: { id: "tenant-42" },
              });
            }

            finalHeaders.push(request.headers);
            return jsonResponse({ ok: true });
          }),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "omits the school-year header when no school year is active",
    () => {
      const finalHeaders: Array<Readonly<Record<string, string>>> = [];

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* testGet(http, "api/rest/view/v1/messages/status");

        expect(finalHeaders).toHaveLength(1);
        expect(finalHeaders[0]?.["Tenant-Id"] ?? finalHeaders[0]?.["tenant-id"]).toBe("tenant-42");
        expect(
          finalHeaders[0]?.["X-Webuntis-Api-School-Year-Id"] ??
            finalHeaders[0]?.["x-webuntis-api-school-year-id"],
        ).toBeUndefined();
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              return new Response(makeJwt(), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              return jsonResponse({
                currentSchoolYear: null,
                tenant: { id: "tenant-42" },
              });
            }
            finalHeaders.push(request.headers);
            return jsonResponse({ ok: true });
          }),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "skips metadata bootstrap when auth-only routes already know the tenant id",
    () => {
      let metadataCalls = 0;
      const finalHeaders: Array<Readonly<Record<string, string>>> = [];

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* testGet(http, "api/rest/view/v1/messages/status", {
          policy: "auth-only",
        });

        expect(metadataCalls).toBe(0);
        expect(finalHeaders).toHaveLength(1);
        expect(
          finalHeaders[0]?.["X-Webuntis-Api-School-Year-Id"] ??
            finalHeaders[0]?.["x-webuntis-api-school-year-id"],
        ).toBeUndefined();
      }).pipe(
        Effect.provide(
          makeCoreTestLayer(
            (request) => {
              const { pathname } = new URL(request.url);

              if (pathname.endsWith("/index.do")) {
                return new Response("", {
                  status: 200,
                  headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
                });
              }
              if (pathname.endsWith("/j_spring_security_check")) {
                return new Response("", {
                  status: 302,
                  headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
                });
              }
              if (pathname.endsWith("/api/token/new")) {
                return new Response(makeJwt(), { status: 200 });
              }
              if (pathname.endsWith("/api/rest/view/v1/app/data")) {
                metadataCalls += 1;
                return jsonResponse({
                  currentSchoolYear: { id: 7 },
                  tenant: { id: "tenant-42" },
                });
              }

              finalHeaders.push(request.headers);
              return jsonResponse({ ok: true });
            },
            { ...testConfig, tenantId: "tenant-42" },
          ),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "refreshes metadata after token rollover before sending metadata-bound requests",
    () => {
      const finalHeaders: Array<Readonly<Record<string, string>>> = [];
      let metadataCalls = 0;
      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* testGet(http, "api/rest/view/v1/messages/status");
        yield* TestClock.adjust(4_000_000);
        yield* testGet(http, "api/rest/view/v1/messages/status");

        expect(metadataCalls).toBe(2);
        expect(finalHeaders).toHaveLength(2);
        expect(
          finalHeaders[0]?.["x-webuntis-api-school-year-id"] ??
            finalHeaders[0]?.["X-Webuntis-Api-School-Year-Id"],
        ).toBe("7");
        expect(
          finalHeaders[1]?.["x-webuntis-api-school-year-id"] ??
            finalHeaders[1]?.["X-Webuntis-Api-School-Year-Id"],
        ).toBe("8");
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              return new Response(makeJwtWithoutExpiry(), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              metadataCalls += 1;
              return jsonResponse({
                currentSchoolYear: { id: metadataCalls === 1 ? 7 : 8 },
                tenant: { id: "tenant-42" },
              });
            }

            finalHeaders.push(request.headers);
            return jsonResponse({ ok: true });
          }),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "reuses tokens without jwt exp claims until an explicit auth failure occurs",
    () => {
      let tokenCalls = 0;

      return Effect.gen(function* () {
        const auth = yield* AuthClient;
        yield* auth.ensureAuthenticated;
        yield* auth.ensureAuthenticated;
        expect(tokenCalls).toBe(1);
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              tokenCalls += 1;
              return new Response(makeJwtWithoutExpiry(), { status: 200 });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "bootstraps tenant metadata for auth-only routes when tenant id is not configured",
    () => {
      let metadataCalls = 0;
      const finalHeaders: Array<Readonly<Record<string, string>>> = [];

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* testGet(http, "api/rest/view/v1/schoolyears", {
          policy: "auth-only",
        });

        expect(metadataCalls).toBe(1);
        expect(finalHeaders).toHaveLength(1);
        expect(finalHeaders[0]?.["Tenant-Id"] ?? finalHeaders[0]?.["tenant-id"]).toBe("tenant-42");
        expect(
          finalHeaders[0]?.["x-webuntis-api-school-year-id"] ??
            finalHeaders[0]?.["X-Webuntis-Api-School-Year-Id"],
        ).toBeUndefined();
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              return new Response(makeJwt(), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              metadataCalls += 1;
              return jsonResponse({
                currentSchoolYear: { id: 7 },
                tenant: { id: "tenant-42" },
              });
            }
            if (pathname.endsWith("/api/rest/view/v1/schoolyears")) {
              finalHeaders.push(request.headers);
              return jsonResponse([
                {
                  id: 7,
                  name: "2025/2026",
                  dateRange: {
                    start: "2026-03-16",
                    end: "2026-03-20",
                  },
                },
              ]);
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "refreshes authentication once when metadata bootstrap is unauthorized",
    () => {
      let tokenCalls = 0;
      let metadataCalls = 0;
      let statusCalls = 0;

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* testGet(http, "api/rest/view/v1/messages/status");

        expect(tokenCalls).toBe(2);
        expect(metadataCalls).toBe(2);
        expect(statusCalls).toBe(1);
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              tokenCalls += 1;
              return new Response(makeJwt(), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              metadataCalls += 1;
              return metadataCalls === 1
                ? new Response("expired", { status: 401 })
                : jsonResponse({
                    currentSchoolYear: { id: 7 },
                    tenant: { id: "tenant-42" },
                  });
            }
            if (pathname.endsWith("/api/rest/view/v1/messages/status")) {
              statusCalls += 1;
              return jsonResponse({ unreadMessagesCount: 0 });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "bounds repeated unauthorized metadata bootstrap to one retry",
    () => {
      let tokenCalls = 0;
      let metadataCalls = 0;
      let statusCalls = 0;

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        const error = yield* Effect.flip(testGet(http, "api/rest/view/v1/messages/status"));

        expect(error).toBeInstanceOf(AuthError);
        expect(tokenCalls).toBe(2);
        expect(metadataCalls).toBe(2);
        expect(statusCalls).toBe(0);
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              tokenCalls += 1;
              return new Response(makeJwt(), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              metadataCalls += 1;
              return new Response("expired", { status: 401 });
            }
            if (pathname.endsWith("/api/rest/view/v1/messages/status")) {
              statusCalls += 1;
              return jsonResponse({ unreadMessagesCount: 0 });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "fails fast when the login handshake returns html instead of a redirect",
    () =>
      Effect.gen(function* () {
        const auth = yield* AuthClient;
        const error = yield* Effect.flip(auth.ensureAuthenticated);

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain("login");
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("<!DOCTYPE html><html>login</html>", {
                status: 200,
                headers: {
                  "content-type": "text/html",
                  "set-cookie": "JSESSIONID=login; Path=/;",
                },
              });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      ),
    30_000,
  );

  it.effect(
    "maps malformed JSON responses to DecodeError through WebUntisHttp",
    () =>
      Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        const error = yield* Effect.flip(
          testGetSchema(
            http,
            "api/rest/view/v1/messages/status",
            Schema.Struct({
              unreadMessagesCount: Schema.Finite,
            }),
          ),
        );

        expect(error).toBeInstanceOf(DecodeError);
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              return new Response(makeJwt(), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              return jsonResponse({
                currentSchoolYear: { id: 7 },
                tenant: { id: "tenant-42" },
              });
            }
            if (pathname.endsWith("/api/rest/view/v1/messages/status")) {
              return new Response("{invalid-json", {
                status: 200,
                headers: { "content-type": "application/json" },
              });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      ),
    30_000,
  );

  it.effect(
    "maps schema drift responses to DecodeError through WebUntisHttp",
    () =>
      Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        const error = yield* Effect.flip(
          testGetSchema(
            http,
            "api/rest/view/v1/messages/status",
            Schema.Struct({
              unreadMessagesCount: Schema.Finite,
            }),
          ),
        );

        expect(error).toBeInstanceOf(DecodeError);
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              return new Response(makeJwt(), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              return jsonResponse({
                currentSchoolYear: { id: 7 },
                tenant: { id: "tenant-42" },
              });
            }
            if (pathname.endsWith("/api/rest/view/v1/messages/status")) {
              return jsonResponse({
                unreadMessagesCount: "0",
              });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      ),
    30_000,
  );

  it.effect(
    "ignores additive response fields at runtime",
    () =>
      Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        const decoded = yield* testGetSchema(
          http,
          "api/rest/view/v1/messages/status",
          Schema.Struct({ unreadMessagesCount: Schema.Finite }),
        );

        expect(decoded).toEqual({ unreadMessagesCount: 0 });
        expect(decoded).not.toHaveProperty("futureField");
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", { status: 200 });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", { status: 302 });
            }
            if (pathname.endsWith("/api/token/new")) {
              return new Response(makeJwt(), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              return jsonResponse({ currentSchoolYear: { id: 7 }, tenant: { id: "tenant-42" } });
            }
            if (pathname.endsWith("/api/rest/view/v1/messages/status")) {
              return jsonResponse({ unreadMessagesCount: 0, futureField: "ignored" });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      ),
    30_000,
  );

  it.effect(
    "preserves tenant metadata when retrying an auth-only request",
    () => {
      const finalHeaders: Array<Readonly<Record<string, string>>> = [];
      let metadataCalls = 0;
      let statusCalls = 0;
      let tokenCalls = 0;

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* testGet(http, "api/rest/view/v1/messages/status", {
          policy: RequestPolicy.AuthOnly,
        });

        expect(statusCalls).toBe(2);
        expect(tokenCalls).toBe(2);
        expect(metadataCalls).toBe(2);
        expect(finalHeaders).toHaveLength(2);
        for (const headers of finalHeaders) {
          expect(headers["tenant-id"] ?? headers["Tenant-Id"]).toBe("tenant-42");
          expect(
            headers["x-webuntis-api-school-year-id"] ?? headers["X-Webuntis-Api-School-Year-Id"],
          ).toBeUndefined();
        }
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", { status: 200 });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", { status: 302 });
            }
            if (pathname.endsWith("/api/token/new")) {
              tokenCalls += 1;
              return new Response(makeJwt(3_600 + tokenCalls), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              metadataCalls += 1;
              return jsonResponse({ currentSchoolYear: { id: 7 }, tenant: { id: "tenant-42" } });
            }
            if (pathname.endsWith("/api/rest/view/v1/messages/status")) {
              statusCalls += 1;
              finalHeaders.push(request.headers);
              return statusCalls === 1
                ? new Response("expired", { status: 401 })
                : jsonResponse({ unreadMessagesCount: 0 });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "does not let a stale concurrent 401 clear a newer session",
    () => {
      let tokenCalls = 0;
      let statusCalls = 0;
      let initialToken = "";
      let releaseSecondInitial!: () => void;
      let signalBothInitial!: () => void;
      const secondInitialMayFinish = new Promise<void>((resolve) => {
        releaseSecondInitial = resolve;
      });
      const bothInitialArrived = new Promise<void>((resolve) => {
        signalBothInitial = resolve;
      });

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* Effect.all(
          [
            testGet(http, "api/rest/view/v1/messages/status", { policy: RequestPolicy.AuthOnly }),
            testGet(http, "api/rest/view/v1/messages/status", { policy: RequestPolicy.AuthOnly }),
          ],
          { concurrency: "unbounded" },
        );

        expect(tokenCalls).toBe(2);
        expect(statusCalls).toBe(4);
      }).pipe(
        Effect.provide(
          makeCoreTestLayer(async (request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", { status: 200 });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", { status: 302 });
            }
            if (pathname.endsWith("/api/token/new")) {
              tokenCalls += 1;
              const token = makeJwt(3_600 + tokenCalls);
              if (tokenCalls === 1) {
                initialToken = token;
              }
              return new Response(token, { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              return jsonResponse({ currentSchoolYear: { id: 7 }, tenant: { id: "tenant-42" } });
            }
            if (pathname.endsWith("/api/rest/view/v1/messages/status")) {
              statusCalls += 1;
              const authorization = request.headers["authorization"] ?? "";
              const isInitialToken = authorization.includes(initialToken);

              if (isInitialToken && statusCalls === 1) {
                await bothInitialArrived;
                return new Response("expired", { status: 401 });
              }
              if (isInitialToken && statusCalls === 2) {
                signalBothInitial();
                await secondInitialMayFinish;
                return new Response("expired", { status: 401 });
              }

              releaseSecondInitial();
              return jsonResponse({ unreadMessagesCount: 0 });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      );
    },
    30_000,
  );

  it.effect(
    "refreshes session and metadata after a 401 before retrying the request",
    () => {
      const finalHeaders: Array<Readonly<Record<string, string>>> = [];
      let metadataCalls = 0;
      let statusCalls = 0;

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* testGet(http, "api/rest/view/v1/messages/status");

        expect(statusCalls).toBe(2);
        expect(metadataCalls).toBe(2);
        expect(finalHeaders).toHaveLength(2);
        expect(
          finalHeaders[0]?.["x-webuntis-api-school-year-id"] ??
            finalHeaders[0]?.["X-Webuntis-Api-School-Year-Id"],
        ).toBe("7");
        expect(
          finalHeaders[1]?.["x-webuntis-api-school-year-id"] ??
            finalHeaders[1]?.["X-Webuntis-Api-School-Year-Id"],
        ).toBe("8");
      }).pipe(
        Effect.provide(
          makeCoreTestLayer((request) => {
            const { pathname } = new URL(request.url);

            if (pathname.endsWith("/index.do")) {
              return new Response("", {
                status: 200,
                headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
              });
            }
            if (pathname.endsWith("/j_spring_security_check")) {
              return new Response("", {
                status: 302,
                headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
              });
            }
            if (pathname.endsWith("/api/token/new")) {
              return new Response(makeJwt(), { status: 200 });
            }
            if (pathname.endsWith("/api/rest/view/v1/app/data")) {
              metadataCalls += 1;
              return jsonResponse({
                currentSchoolYear: { id: metadataCalls === 1 ? 7 : 8 },
                tenant: { id: "tenant-42" },
              });
            }
            if (pathname.endsWith("/api/rest/view/v1/messages/status")) {
              statusCalls += 1;
              finalHeaders.push(request.headers);

              if (statusCalls === 1) {
                return new Response(JSON.stringify({ error: "expired" }), {
                  status: 401,
                  headers: {
                    "content-type": "application/json",
                  },
                });
              }

              return jsonResponse({ unreadMessagesCount: 0 });
            }

            throw new Error(`Unexpected request: ${request.method} ${request.url}`);
          }),
        ),
      );
    },
    30_000,
  );
});
