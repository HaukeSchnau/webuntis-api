import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { WebUntisClient } from "../../src/client.ts";
import { AppClient } from "../../src/domains/app/index.ts";
import { ClassregClient } from "../../src/domains/classreg/index.ts";
import { MessagesClient } from "../../src/domains/messages/index.ts";
import { TimetableClient } from "../../src/domains/timetable/index.ts";
import * as api from "../../src/index.ts";
import { jsonResponse, makeCoreTestLayer, makeJwt } from "./helpers.ts";

describe("public structure", () => {
  // A snapshot of the whole surface, so an accidental addition is as visible as
  // an accidental removal. Schema values must stay on the `/schemas` subpath.
  it("pins the root export surface", () => {
    expect(Object.keys(api).sort()).toMatchInlineSnapshot(`
      [
        "AppClient",
        "AuthClient",
        "AuthError",
        "ClassregClient",
        "ClientConfig",
        "ConfigurationError",
        "DecodeError",
        "DiscoveryError",
        "ExamsClient",
        "InvalidRequestError",
        "MessagesClient",
        "ProfileClient",
        "SchoolyearsClient",
        "SessionClient",
        "TimetableClient",
        "TransportError",
        "WebUntisClient",
        "clientConfigFromEnv",
        "makeWebUntisLayer",
        "webUntisLayer",
        "withSchoolYear",
      ]
    `);
  });

  // Consumers need to name the element type of a collection response, not just
  // its container, so the two must be exported together.
  it("exports a type for every schema on the public schema surface", () => {
    const domainsDir = new URL("../../src/domains/", import.meta.url);
    const schemaFiles = readdirSync(domainsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => new URL(`${entry.name}/schema.ts`, domainsDir))
      .filter((url) => existsSync(url));

    const missing = schemaFiles.flatMap((url) => {
      const source = readFileSync(url, "utf8");
      const types = new Set(source.match(/^export type (\w+)/gmu)?.map((line) => line.slice(12)));

      return [...(source.match(/^export const (\w+)Schema\b/gmu) ?? [])]
        .map((line) => line.slice(13, -6))
        .filter((name) => !types.has(name))
        .map((name) => `${url.pathname.split("/domains/")[1]}: ${name}Schema`);
    });

    expect(missing).toEqual([]);
  });

  it.effect("wires explicit domain services onto the composed client", () =>
    Effect.gen(function* () {
      const client = yield* WebUntisClient;
      const app = yield* AppClient;
      const classreg = yield* ClassregClient;
      const messages = yield* MessagesClient;
      const timetable = yield* TimetableClient;

      expect(client.app).toBe(app);
      expect(client.classreg).toBe(classreg);
      expect(client.messages).toBe(messages);
      expect(client.timetable).toBe(timetable);
      expect(Effect.isEffect(client.app.getHome)).toBe(true);
      expect(Effect.isEffect(client.app.getExamIntegrations)).toBe(true);
      expect(typeof client.classreg.getHomeworkList).toBe("function");
      expect(Effect.isEffect(client.exams.getForClass)).toBe(true);
      expect(Effect.isEffect(client.messages.getStatus)).toBe(true);
      expect(typeof client.messages.filterComposeRecipients).toBe("function");
      expect(typeof client.timetable.getEntries).toBe("function");
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

          return jsonResponse([]);
        }),
      ),
    ),
  );
});
