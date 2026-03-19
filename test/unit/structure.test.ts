import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as api from "../../src/index.ts";
import { WebUntisClient } from "../../src/client.ts";
import { makeCoreTestLayer, jsonResponse, makeJwt } from "./helpers.ts";

describe("public structure", () => {
  it("keeps the main root exports intact", () => {
    expect(api).toHaveProperty("WebUntisClient");
    expect(api).toHaveProperty("makeWebUntisLayer");
    expect(api).toHaveProperty("clientConfigFromEnv");
  });

  it.effect("wires experimental helpers onto the composed client", () =>
    Effect.gen(function*() {
      const client = yield* WebUntisClient;

      expect(client.rawViewApi).toBeDefined();
      expect(client.experimental.rawViewApi).toBeDefined();
      expect(client.experimental.calendarEntry).toBeDefined();
      expect(typeof client.experimental.calendarEntry.getTodayEntries).toBe("function");
      expect(typeof client.experimental.profile.getProfileJson).toBe("object");
      expect(typeof client.experimental.timetable.getFormatListJson).toBe("object");
    }).pipe(
      Effect.provide(makeCoreTestLayer((request) => {
        const { pathname } = new URL(request.url);

        if (pathname.endsWith("/index.do")) {
          return new Response("", {
            status: 200,
            headers: { "set-cookie": "JSESSIONID=seed; Path=/;" }
          });
        }
        if (pathname.endsWith("/j_spring_security_check")) {
          return new Response("", {
            status: 302,
            headers: { "set-cookie": "JSESSIONID=login; Path=/;" }
          });
        }
        if (pathname.endsWith("/api/token/new")) {
          return new Response(makeJwt(), { status: 200 });
        }
        if (pathname.endsWith("/api/rest/view/v1/app/data")) {
          return jsonResponse({
            currentSchoolYear: { id: 7 },
            tenant: { id: "tenant-42" }
          });
        }

        return jsonResponse([]);
      }))
    ));
});
