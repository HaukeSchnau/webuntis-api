import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { AuthClient } from "../../src/auth.ts";
import { DecodeError } from "../../src/internal/errors.ts";
import { WebUntisHttp } from "../../src/internal/http.ts";
import { jsonResponse, makeCoreTestLayer, makeJwt, testConfig } from "./helpers.ts";

describe("bootstrap and transport", () => {
  it.effect(
    "deduplicates concurrent authentication refreshes",
    () => {
      let seedCalls = 0;
      let loginCalls = 0;
      let tokenCalls = 0;

      return Effect.gen(function* () {
        const auth = yield* AuthClient;
        const [stateA, stateB] = yield* Effect.all(
          [auth.ensureAuthenticated(), auth.ensureAuthenticated()],
          { concurrency: "unbounded" },
        );

        expect(stateA.token).toBeDefined();
        expect(stateB.token).toBeDefined();
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
        yield* http.get("api/rest/view/v1/messages/status");

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
    "skips metadata bootstrap when auth-only routes already know the tenant id",
    () => {
      let metadataCalls = 0;
      const finalHeaders: Array<Readonly<Record<string, string>>> = [];

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* http.get("api/rest/view/v1/messages/status", {
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
      const originalNow = Date.now;
      let currentNow = originalNow();
      Date.now = () => currentNow;

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* http.get("api/rest/view/v1/messages/status");
        currentNow += 4_000_000;
        yield* http.get("api/rest/view/v1/messages/status");

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
        Effect.ensuring(
          Effect.sync(() => {
            Date.now = originalNow;
          }),
        ),
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
        const first = yield* auth.ensureAuthenticated();
        const second = yield* auth.ensureAuthenticated();

        expect(first.token).toBeDefined();
        expect(second.token).toBeDefined();
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
              return new Response(makeJwt(undefined), { status: 200 });
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
        yield* http.get("api/rest/view/v1/schoolyears", {
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
    "fails fast when the login handshake returns html instead of a redirect",
    () =>
      Effect.gen(function* () {
        const auth = yield* AuthClient;
        const error = yield* Effect.flip(auth.ensureAuthenticated());

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
          http.getSchema(
            "api/rest/view/v1/messages/status",
            Schema.Struct({
              unreadMessagesCount: Schema.Number,
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
          http.getSchema(
            "api/rest/view/v1/messages/status",
            Schema.Struct({
              unreadMessagesCount: Schema.Number,
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
    "refreshes session and metadata after a 401 before retrying the request",
    () => {
      const finalHeaders: Array<Readonly<Record<string, string>>> = [];
      let metadataCalls = 0;
      let statusCalls = 0;

      return Effect.gen(function* () {
        const http = yield* WebUntisHttp;
        yield* http.get("api/rest/view/v1/messages/status");

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
