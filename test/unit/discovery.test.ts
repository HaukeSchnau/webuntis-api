import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { SchoolDiscovery } from "../../src/internal/discovery.ts";
import { DiscoveryError } from "../../src/internal/errors.ts";
import { jsonResponse, makeCoreTestLayer, testConfig } from "./helpers.ts";

describe("school discovery", () => {
  it.effect("resolves an exact school match", () =>
    Effect.gen(function* () {
      const discovery = yield* SchoolDiscovery;
      const school = yield* discovery.resolve("IGS Lilienthal");

      expect(school.loginName).toBe("igs-lilienthal");
      expect(school.server).toBe("igs-lilienthal.webuntis.com");
    }).pipe(
      Effect.provide(
        makeCoreTestLayer(
          (request) => {
            const { pathname } = new URL(request.url);

            if (pathname === "/schoolquery2") {
              return jsonResponse({
                result: {
                  schools: [
                    {
                      server: "igs-lilienthal.webuntis.com",
                      address: "",
                      displayName: "IGS Lilienthal",
                      loginName: "igs-lilienthal",
                      schoolId: 1,
                      serverUrl:
                        "https://igs-lilienthal.webuntis.com/WebUntis/?school=igs-lilienthal",
                      tenantId: "tenant-42",
                    },
                  ],
                },
                id: "wu_schulsuche-1",
                jsonrpc: "2.0",
              });
            }

            throw new Error(
              `Unexpected request: ${request.method} ${request.url}`,
            );
          },
          {
            ...testConfig,
            schoolLoginName: undefined,
            serverUrl: undefined,
          },
        ),
      ),
    ),
  );

  it.effect("fails when school discovery results are ambiguous", () =>
    Effect.gen(function* () {
      const discovery = yield* SchoolDiscovery;
      const error = yield* Effect.flip(discovery.resolve("IGS Lilienthal"));

      expect(error).toBeInstanceOf(DiscoveryError);
      if (error instanceof DiscoveryError) {
        expect(error.matches).toHaveLength(2);
        expect(error.message).toContain("ambiguous");
      }
    }).pipe(
      Effect.provide(
        makeCoreTestLayer(
          (request) => {
            const { pathname } = new URL(request.url);

            if (pathname === "/schoolquery2") {
              return jsonResponse({
                result: {
                  schools: [
                    {
                      server: "igs-lilienthal.webuntis.com",
                      address: "",
                      displayName: "IGS Lilienthal Campus A",
                      loginName: "igs-lilienthal-a",
                      schoolId: 1,
                      serverUrl:
                        "https://igs-lilienthal.webuntis.com/WebUntis/?school=igs-lilienthal-a",
                      tenantId: "tenant-a",
                    },
                    {
                      server: "igs-lilienthal-2.webuntis.com",
                      address: "",
                      displayName: "IGS Lilienthal Campus B",
                      loginName: "igs-lilienthal-b",
                      schoolId: 2,
                      serverUrl:
                        "https://igs-lilienthal-2.webuntis.com/WebUntis/?school=igs-lilienthal-b",
                      tenantId: "tenant-b",
                    },
                  ],
                },
                id: "wu_schulsuche-1",
                jsonrpc: "2.0",
              });
            }

            throw new Error(
              `Unexpected request: ${request.method} ${request.url}`,
            );
          },
          {
            ...testConfig,
            schoolLoginName: undefined,
            serverUrl: undefined,
          },
        ),
      ),
    ),
  );

  it.effect("fails when school discovery returns no matches", () =>
    Effect.gen(function* () {
      const discovery = yield* SchoolDiscovery;
      const error = yield* Effect.flip(discovery.resolve("Unknown School"));

      expect(error).toBeInstanceOf(DiscoveryError);
      if (error instanceof DiscoveryError) {
        expect(error.message).toContain("No WebUntis tenant matched");
      }
    }).pipe(
      Effect.provide(
        makeCoreTestLayer(
          (request) => {
            const { pathname } = new URL(request.url);

            if (pathname === "/schoolquery2") {
              return jsonResponse({
                result: {
                  schools: [],
                },
                id: "wu_schulsuche-1",
                jsonrpc: "2.0",
              });
            }

            throw new Error(
              `Unexpected request: ${request.method} ${request.url}`,
            );
          },
          {
            ...testConfig,
            schoolLoginName: undefined,
            serverUrl: undefined,
          },
        ),
      ),
    ),
  );
});
