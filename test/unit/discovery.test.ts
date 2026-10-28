import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { AuthClient } from "../../src/auth.ts";
import { findSchool, searchSchools } from "../../src/internal/discovery.ts";
import { DiscoveryError } from "../../src/internal/errors.ts";
import {
  jsonResponse,
  makeCoreTestLayer,
  makeJwt,
  mockHttpLayer,
  testConnection,
} from "./helpers.ts";

const school = (loginName: string, displayName: string, server: string, schoolId: number) => ({
  server,
  address: "",
  displayName,
  loginName,
  schoolId,
  serverUrl: `https://${server}/WebUntis/?school=${loginName}`,
  tenantId: `tenant-${schoolId}`,
});

const igs = school("igs-lilienthal", "IGS Lilienthal", "igs-lilienthal.webuntis.com", 1);

const searchReturning = (schools: ReadonlyArray<ReturnType<typeof school>>) =>
  mockHttpLayer((request) => {
    if (new URL(request.url).pathname === "/schoolquery2") {
      return jsonResponse({ result: { schools }, id: "wu_schulsuche-1", jsonrpc: "2.0" });
    }
    throw new Error(`Unexpected request: ${request.method} ${request.url}`);
  });

describe("school search", () => {
  it.effect("returns every school the directory describes", () =>
    Effect.gen(function* () {
      const schools = yield* searchSchools("lilienthal");

      expect(schools).toEqual([igs]);
    }).pipe(Effect.provide(searchReturning([igs]))),
  );

  it.effect("resolves an exact school match", () =>
    Effect.gen(function* () {
      const found = yield* findSchool("IGS Lilienthal");

      expect(found.loginName).toBe("igs-lilienthal");
      expect(found.server).toBe("igs-lilienthal.webuntis.com");
    }).pipe(
      Effect.provide(
        searchReturning([igs, school("igs-lilienthal-2", "IGS Lilienthal 2", "other.test", 2)]),
      ),
    ),
  );

  it.effect("resolves a sole login-name match", () =>
    Effect.gen(function* () {
      const found = yield* findSchool("igs");

      expect(found.displayName).toBe("IGS Lilienthal");
    }).pipe(Effect.provide(searchReturning([igs]))),
  );

  it.effect("fails when school discovery results are ambiguous", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(findSchool("IGS"));

      expect(error).toBeInstanceOf(DiscoveryError);
      if (error instanceof DiscoveryError) {
        expect(error.matches).toHaveLength(2);
        expect(error.message).toContain("ambiguous");
      }
    }).pipe(
      Effect.provide(
        searchReturning([
          school("igs-a", "IGS Campus A", "a.webuntis.com", 1),
          school("igs-b", "IGS Campus B", "b.webuntis.com", 2),
        ]),
      ),
    ),
  );

  it.effect("fails when school discovery returns no matches", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(findSchool("Unknown School"));

      expect(error).toBeInstanceOf(DiscoveryError);
      expect(error.message).toContain("No WebUntis tenant matched");
    }).pipe(Effect.provide(searchReturning([]))),
  );

  it.effect("looks a school name up once when the connection first logs in", () => {
    const requests: Array<string> = [];

    return Effect.gen(function* () {
      const auth = yield* AuthClient;
      yield* auth.ensureAuthenticated;
      yield* auth.refresh;

      expect(requests).toEqual([
        "schoolsearch.webuntis.com/schoolquery2",
        "igs-lilienthal.webuntis.com/WebUntis/index.do",
        "igs-lilienthal.webuntis.com/WebUntis/j_spring_security_check",
        "igs-lilienthal.webuntis.com/WebUntis/api/token/new",
        "igs-lilienthal.webuntis.com/WebUntis/index.do",
        "igs-lilienthal.webuntis.com/WebUntis/j_spring_security_check",
        "igs-lilienthal.webuntis.com/WebUntis/api/token/new",
      ]);
    }).pipe(
      Effect.provide(
        makeCoreTestLayer(
          (request) => {
            const url = new URL(request.url);
            requests.push(`${url.host}${url.pathname}`);

            if (url.pathname === "/schoolquery2") {
              return jsonResponse({ result: { schools: [igs] }, id: "1", jsonrpc: "2.0" });
            }
            if (url.pathname.endsWith("/j_spring_security_check")) {
              return new Response("", { status: 302 });
            }
            if (url.pathname.endsWith("/api/token/new")) {
              return new Response(makeJwt(), { status: 200 });
            }
            return new Response("", { status: 200 });
          },
          { ...testConnection, school: "IGS Lilienthal" },
        ),
      ),
    );
  });
});
