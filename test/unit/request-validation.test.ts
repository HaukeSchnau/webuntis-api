import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { AppRequests } from "../../src/domains/app/requests.ts";
import { ExamsRequests } from "../../src/domains/exams/requests.ts";
import { MessagesRequests } from "../../src/domains/messages/requests.ts";
import { SessionRequests } from "../../src/domains/session/requests.ts";
import { TimetableRequests } from "../../src/domains/timetable/requests.ts";
import { InvalidRequestError } from "../../src/internal/errors.ts";
import {
  PositiveInteger,
  type RequestDescriptor,
  RequestPolicy,
  request,
  validateAndResolveRequest,
  validateRequest,
} from "../../src/internal/request.ts";

/**
 * Feeds a descriptor input its own type system would reject. The point of these
 * cases is exactly that the compile-time type and the runtime schema disagree,
 * so the cast is the subject of the test rather than a shortcut around it.
 */
const rejects = <Input>(descriptor: RequestDescriptor<Input>, input: unknown) =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  Effect.flip(validateRequest(descriptor, input as Input));

describe("request descriptor validation", () => {
  it.effect("rejects invalid input before resolving path, query, headers, or body", () => {
    const evaluated: Array<string> = [];
    const descriptor = request<{ readonly id: number }>({
      method: "POST",
      path: ({ id }) => {
        evaluated.push("path");
        return `items/${id}`;
      },
      query: ({ id }) => {
        evaluated.push("query");
        return { id };
      },
      headers: () => {
        evaluated.push("headers");
        return { "x-test": "test" };
      },
      body: ({ id }) => {
        evaluated.push("body");
        return { id };
      },
      policy: RequestPolicy.AuthOnly,
      operation: "items/{id}",
      inputSchema: Schema.Struct({ id: PositiveInteger }),
    });

    return Effect.gen(function* () {
      const error = yield* Effect.flip(validateAndResolveRequest(descriptor, { id: 0 }));

      expect(error).toBeInstanceOf(InvalidRequestError);
      expect(error.path).toBe("items/{id}");
      expect(error.message).toContain("positive integer");
      expect(evaluated).toEqual([]);
    });
  });

  it.effect("resolves valid input without changing its wire representation", () => {
    const descriptor = request<{ readonly ids: ReadonlyArray<number> }>({
      method: "GET",
      path: "items",
      query: ({ ids }) => ({ ids: ids.join(",") }),
      policy: RequestPolicy.Metadata,
      inputSchema: Schema.Struct({ ids: Schema.Array(PositiveInteger) }),
    });

    return Effect.gen(function* () {
      const resolved = yield* validateAndResolveRequest(descriptor, { ids: [1, 2, 3] });

      expect(resolved.path).toBe("items");
      expect(resolved.query).toEqual({ ids: "1,2,3" });
    });
  });

  it.effect("validates domain-specific identifiers, ranges, resources, and search text", () =>
    Effect.gen(function* () {
      yield* Effect.flip(validateRequest(ExamsRequests.getExam, { id: Number.NaN }));
      yield* Effect.flip(
        validateRequest(ExamsRequests.list, { start: "2026-03-20", end: "2026-03-16" }),
      );
      yield* rejects(TimetableRequests.getEntries, {
        start: "2026-03-16",
        end: "2026-03-20",
        resourceType: "CLASS",
        resources: [],
      });
      yield* Effect.flip(
        validateRequest(MessagesRequests.searchRecipients, {
          recipientOption: "STAFF",
          searchText: "   ",
        }),
      );
      yield* Effect.flip(
        validateRequest(TimetableRequests.getAvailableRooms, {
          startDateTime: "2026-03-16T10:00:00",
          endDateTime: "2026-03-16T08:00:00",
        }),
      );
      yield* rejects(AppRequests.getOnboarding, { type: "OTHER" });
      yield* Effect.flip(validateRequest(SessionRequests.getStatus, { clientTimeZone: "   " }));
      yield* rejects(TimetableRequests.getEntriesSettings, { resourceType: "OTHER" });

      const input = {
        start: "2026-03-16",
        end: "2026-03-20",
        resourceType: "CLASS" as const,
        resources: [1, 2] as const,
      };
      expect(yield* validateRequest(TimetableRequests.getEntries, input)).toEqual(input);
    }),
  );
});
