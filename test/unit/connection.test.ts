import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, LayerMap, Redacted } from "effect";
import { webUntisLayer } from "../../src/client.ts";
import { SchoolyearsClient } from "../../src/domains/schoolyears/index.ts";
import { Credential, WebUntisConnection } from "../../src/internal/connection.ts";
import { ConfigurationError } from "../../src/internal/errors.ts";
import { jsonResponse, mockHttpLayer, testConnection } from "./helpers.ts";

const fromEnv = (env: Record<string, string>) =>
  WebUntisConnection.fromEnv.parse(ConfigProvider.fromEnv({ env }));

describe("connections", () => {
  it.effect("pins the school when login name and server URL are set", () =>
    Effect.gen(function* () {
      const connection = yield* fromEnv({
        WEBUNTIS_SCHOOL_LOGIN_NAME: "igs-lilienthal",
        WEBUNTIS_SERVER_URL: "https://igs-lilienthal.webuntis.com/WebUntis/",
        WEBUNTIS_USERNAME: "tester",
        WEBUNTIS_PASSWORD: "secret",
      });

      expect(connection.school).toEqual({
        loginName: "igs-lilienthal",
        serverUrl: "https://igs-lilienthal.webuntis.com/WebUntis/",
        tenantId: undefined,
      });
      expect(connection.credential._tag).toBe("Password");
      expect(Redacted.value(connection.credential.password)).toBe("secret");
    }),
  );

  it.effect("looks the school up by name when it is not pinned", () =>
    Effect.gen(function* () {
      const connection = yield* fromEnv({
        WEBUNTIS_SCHOOL_NAME: "IGS Lilienthal",
        WEBUNTIS_USERNAME: "tester",
        WEBUNTIS_PASSWORD: "secret",
      });

      expect(connection.school).toBe("IGS Lilienthal");
    }),
  );

  it.effect("fails when the environment names no school", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        fromEnv({ WEBUNTIS_USERNAME: "tester", WEBUNTIS_PASSWORD: "secret" }),
      );

      expect(error.message).toContain("WEBUNTIS_SCHOOL_NAME");
    }),
  );

  it.effect("rejects a pinned server URL that cannot address WebUntis", () =>
    Effect.gen(function* () {
      for (const serverUrl of ["file:///tmp/webuntis", "https://", "http://exa mple.com"]) {
        const error = yield* Effect.flip(
          Layer.build(
            webUntisLayer({ ...testConnection, school: { loginName: "x", serverUrl } }),
          ).pipe(Effect.provide(mockHttpLayer(() => new Response()))),
        );

        expect(error).toBeInstanceOf(ConfigurationError);
      }
    }),
  );

  it.effect("keeps several schools and accounts apart in one process", () => {
    const logins: Array<string> = [];
    const reads: Array<string> = [];
    const connections = {
      a: {
        school: { loginName: "school-a", serverUrl: "a.webuntis.test" },
        credential: Credential.Password({ username: "alice", password: Redacted.make("1") }),
      },
      b: {
        school: { loginName: "school-b", serverUrl: "b.webuntis.test", tenantId: "tenant-b" },
        credential: Credential.Password({ username: "bob", password: Redacted.make("2") }),
      },
    } satisfies Record<string, WebUntisConnection>;

    const http = mockHttpLayer((request) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/j_spring_security_check")) {
        const body = request.body._tag === "Uint8Array" ? request.body.body : new Uint8Array();
        const form = new URLSearchParams(new TextDecoder().decode(body));
        logins.push(`${url.host} ${form.get("school")} ${form.get("j_username")}`);
        return new Response("", { status: 302 });
      }
      if (url.pathname.endsWith("/api/token/new")) {
        return new Response(`${url.host}-token`, { status: 200 });
      }
      if (url.pathname.endsWith("/app/data")) {
        return jsonResponse({ currentSchoolYear: null, tenant: { id: `tenant-of-${url.host}` } });
      }
      if (url.pathname.endsWith("/schoolyears")) {
        reads.push(
          `${url.host} ${request.headers["authorization"]} ${request.headers["tenant-id"]}`,
        );
        return jsonResponse([]);
      }
      return new Response("", { status: 200 });
    });

    return Effect.gen(function* () {
      const schools = yield* LayerMap.make((key: keyof typeof connections) =>
        webUntisLayer(connections[key]).pipe(Layer.provide(http)),
      );
      const listYears = (key: keyof typeof connections) =>
        SchoolyearsClient.use((client) => client.list).pipe(Effect.provide(schools.get(key)));

      yield* Effect.all([listYears("a"), listYears("b"), listYears("a"), listYears("b")], {
        concurrency: "unbounded",
      });

      expect(logins.sort()).toEqual([
        "a.webuntis.test school-a alice",
        "b.webuntis.test school-b bob",
      ]);
      expect(reads.sort()).toEqual([
        "a.webuntis.test Bearer a.webuntis.test-token tenant-of-a.webuntis.test",
        "a.webuntis.test Bearer a.webuntis.test-token tenant-of-a.webuntis.test",
        "b.webuntis.test Bearer b.webuntis.test-token tenant-b",
        "b.webuntis.test Bearer b.webuntis.test-token tenant-b",
      ]);
    });
  });
});
