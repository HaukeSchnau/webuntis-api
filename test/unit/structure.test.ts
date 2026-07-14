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
  it("keeps the main root exports intact", () => {
    expect(api).toHaveProperty("WebUntisClient");
    expect(api).toHaveProperty("makeWebUntisLayer");
    expect(api).toHaveProperty("withSchoolYear");
    expect(api).toHaveProperty("clientConfigFromEnv");
    expect(api).toHaveProperty("AppClient");
    expect(api).toHaveProperty("MessagesClient");
    expect(api).toHaveProperty("TimetableClient");
    expect(api).toHaveProperty("TransportError");
    expect(api).not.toHaveProperty("HomeSchema");
    expect(api).not.toHaveProperty("WebUntisHttp");
    expect(api).not.toHaveProperty("SchoolDiscovery");
    expect(api).not.toHaveProperty("Bootstrap");
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
      expect(typeof client.app.getHome).toBe("function");
      expect(typeof client.withSchoolYear).toBe("function");
      expect(typeof client.app.getExamIntegrations).toBe("function");
      expect(typeof client.classreg.getHomeworkList).toBe("function");
      expect(typeof client.exams.getForClass).toBe("function");
      expect(typeof client.messages.getStatus).toBe("function");
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
