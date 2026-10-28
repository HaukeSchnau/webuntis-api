import { describe, expect, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import {
  TimetableClient,
  type TimetableEntriesForResource,
} from "../../src/domains/timetable/index.ts";
import { DecodeError, InvalidRequestError, PermissionDenied } from "../../src/internal/errors.ts";
import { jsonResponse, makeCoreTestLayer, makeJwt } from "./helpers.ts";

const week = { start: "2026-03-16", end: "2026-03-20", resourceType: "CLASS" } as const;

/** Answers each entries request according to its single `resources` id. */
const timetableFor = (sent: Array<string>, entries: (resource: string) => Response) =>
  makeCoreTestLayer((request) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/j_spring_security_check")) {
      return new Response("", { status: 302 });
    }
    if (url.pathname.endsWith("/api/token/new")) {
      return new Response(makeJwt(), { status: 200 });
    }
    if (url.pathname.endsWith("/app/data")) {
      return jsonResponse({ currentSchoolYear: { id: 7 }, tenant: { id: "tenant-42" } });
    }
    if (url.pathname.endsWith("/timetable/entries")) {
      const param = Array.from(request.urlParams).find(([key]) => key === "resources")?.[1];
      const resource = typeof param === "string" ? param : "";
      sent.push(resource);
      return entries(resource);
    }
    return new Response("", { status: 200 });
  });

const valid = { format: 2, days: [], errors: [] };

const failureOf = (entry: TimetableEntriesForResource | undefined) =>
  entry !== undefined && Result.isFailure(entry.result) ? entry.result.failure : undefined;

describe("timetable entries for many resources", () => {
  it.effect("reports each resource on its own, keeping the raw JSON when asked", () => {
    const sent: Array<string> = [];

    return Effect.gen(function* () {
      const timetable = yield* TimetableClient;
      const results = yield* timetable.getEntriesForResources(
        { ...week, resources: [1, 2, 3, 4] },
        { raw: true },
      );

      expect(sent).toEqual(["1", "2", "3", "4"]);
      expect(results.map((entry) => entry.resource)).toEqual([1, 2, 3, 4]);

      const [ok, denied, malformed, additive] = results;
      expect(ok?.result).toEqual(Result.succeed(valid));
      expect(ok?.raw).toEqual(valid);

      expect(denied?.raw).toBeUndefined();
      expect(failureOf(denied)).toBeInstanceOf(PermissionDenied);

      // A body the schema rejects is still kept, so nothing WebUntis sent is lost.
      expect(malformed?.raw).toEqual({ ...valid, format: "2" });
      expect(failureOf(malformed)).toBeInstanceOf(DecodeError);

      expect(additive?.result).toEqual(Result.succeed(valid));
      expect(additive?.raw).toEqual({ ...valid, futureField: "kept" });
    }).pipe(
      Effect.provide(
        timetableFor(sent, (resource) => {
          switch (resource) {
            case "2":
              return new Response(JSON.stringify({ errorCode: "FORBIDDEN" }), { status: 403 });
            case "3":
              return jsonResponse({ ...valid, format: "2" });
            case "4":
              return jsonResponse({ ...valid, futureField: "kept" });
            default:
              return jsonResponse(valid);
          }
        }),
      ),
    );
  });

  it.effect("leaves the raw JSON out unless asked", () =>
    Effect.gen(function* () {
      const timetable = yield* TimetableClient;
      const [only] = yield* timetable.getEntriesForResources({ ...week, resources: [1] });

      expect(only).toEqual({ resource: 1, result: Result.succeed(valid) });
    }).pipe(Effect.provide(timetableFor([], () => jsonResponse(valid)))),
  );

  it.effect("rejects invalid input before sending anything", () => {
    const sent: Array<string> = [];

    return Effect.gen(function* () {
      const timetable = yield* TimetableClient;
      const notAnId = yield* Effect.flip(
        timetable.getEntriesForResources({ ...week, resources: [1, 0] }),
      );
      const backwards = yield* Effect.flip(
        timetable.getEntriesForResources({ ...week, end: "2026-03-01", resources: [1] }),
      );

      expect(notAnId).toBeInstanceOf(InvalidRequestError);
      expect(backwards).toBeInstanceOf(InvalidRequestError);
      expect(sent).toEqual([]);
    }).pipe(Effect.provide(timetableFor(sent, () => jsonResponse(valid))));
  });
});
