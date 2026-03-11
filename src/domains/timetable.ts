import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import {
  TimetableEntriesSchema,
  TimetableEntriesSettingsSchema,
  TimetableFilterSchema,
  TimetableGridSchema,
  TimetableMenuSchema,
  TimetableSearchSchema
} from "./schemas.ts";

export interface TimetableEntriesRequest {
  readonly start: string;
  readonly end: string;
  readonly resourceType: "CLASS" | "TEACHER" | "ROOM" | "SUBJECT" | "STUDENT";
  readonly resources: ReadonlyArray<number>;
  readonly timetableType?: string | undefined;
  readonly format?: number | undefined;
  readonly layout?: string | undefined;
  readonly periodTypes?: string | undefined;
}

export interface TimetableFilterRequest {
  readonly start: string;
  readonly end: string;
  readonly resourceType: "CLASS" | "TEACHER" | "ROOM" | "SUBJECT" | "STUDENT";
  readonly timetableType?: string | undefined;
}

export interface TimetableEntriesSettingsRequest {
  readonly resourceType: "CLASS" | "TEACHER" | "ROOM" | "SUBJECT" | "STUDENT";
  readonly format?: number | undefined;
}

export interface TimetableSearchRequest {
  readonly query: string;
  readonly schoolyear: number;
}

export const makeTimetableClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getGrid: (timetableType = "STANDARD") =>
      http.getSchema("api/rest/view/v1/timetable/grid", TimetableGridSchema, {
        query: { timetableType }
      }),
    getFilter: (request: TimetableFilterRequest) =>
      http.getSchema("api/rest/view/v1/timetable/filter", TimetableFilterSchema, {
        query: {
          resourceType: request.resourceType,
          timetableType: request.timetableType ?? "STANDARD",
          start: request.start,
          end: request.end
        }
      }),
    getEntriesSettings: (request: TimetableEntriesSettingsRequest) =>
      http.getSchema("api/rest/view/v1/timetable/entries/settings", TimetableEntriesSettingsSchema, {
        query: {
          format: request.format ?? 2,
          resourceType: request.resourceType
        }
      }),
    getMenu: http.getSchema("api/rest/view/v1/timetable/menu", TimetableMenuSchema, {
      withSchoolYearHeader: false
    }),
    search: (request: TimetableSearchRequest) =>
      http.getSchema("api/rest/view/v1/timetable/search", TimetableSearchSchema, {
        query: {
          q: request.query,
          schoolyear: request.schoolyear
        },
        withSchoolYearHeader: false
      }),
    getEntries: (request: TimetableEntriesRequest) =>
      http.getSchema("api/rest/view/v1/timetable/entries", TimetableEntriesSchema, {
        query: {
          start: request.start,
          end: request.end,
          format: request.format ?? 2,
          resourceType: request.resourceType,
          resources: request.resources.join(","),
          periodTypes: request.periodTypes ?? "",
          timetableType: request.timetableType ?? "STANDARD",
          layout: request.layout ?? "START_TIME"
        }
      })
  };
});
