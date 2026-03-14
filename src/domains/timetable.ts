import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import {
  TimetableAvailableRoomsSchema,
  TimetableCalendarSchema,
  TimetableEntriesSchema,
  TimetableEntriesSettingsSchema,
  TimetableEntriesWeekOverviewSchema,
  TimetableExternalCalendarSchema,
  TimetableFilterSchema,
  TimetableGridSchema,
  TimetableMenuSchema,
  TimetableSearchSchema,
  TimeGridSchema
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

export interface TimetableCalendarRequest {
  readonly myTimetable?: boolean | undefined;
  readonly timetableType?: string | undefined;
}

export interface TimetableAvailableRoomsRequest {
  readonly startDateTime: string;
  readonly endDateTime: string;
}

export interface TimetableEntriesWeekOverviewRequest {
  readonly start: string;
  readonly end: string;
  readonly resourceType: "CLASS" | "TEACHER" | "ROOM" | "SUBJECT" | "STUDENT";
  readonly resources: ReadonlyArray<number>;
  readonly timetableType?: string | undefined;
}

export const makeTimetableClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getTimeGrid: http.getSchema("api/rest/view/v1/timegrid", TimeGridSchema),
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
    getCalendar: (request: TimetableCalendarRequest = {}) =>
      http.getSchema("api/rest/view/v1/timetable/calendar", TimetableCalendarSchema, {
        query: {
          myTimetable: request.myTimetable,
          timetableType: request.timetableType
        },
        withSchoolYearHeader: false
      }),
    getExternalCalendar: http.getSchema(
      "api/rest/view/v1/timetable/externalCalendar",
      TimetableExternalCalendarSchema,
      { withSchoolYearHeader: false }
    ),
    search: (request: TimetableSearchRequest) =>
      http.getSchema("api/rest/view/v1/timetable/search", TimetableSearchSchema, {
        query: {
          q: request.query,
          schoolyear: request.schoolyear
        },
        withSchoolYearHeader: false
      }),
    getAvailableRooms: (request: TimetableAvailableRoomsRequest) =>
      http.getSchema("api/rest/view/v2/timetable/availableRooms", TimetableAvailableRoomsSchema, {
        query: {
          startDateTime: request.startDateTime,
          endDateTime: request.endDateTime
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
      }),
    getEntriesWeekOverview: (request: TimetableEntriesWeekOverviewRequest) =>
      http.getSchema("api/rest/view/v1/timetable/entriesWeekOverview", TimetableEntriesWeekOverviewSchema, {
        query: {
          start: request.start,
          end: request.end,
          resourceType: request.resourceType,
          resources: request.resources.join(","),
          timetableType: request.timetableType ?? "OVERVIEW_WEEK"
        }
      }),
    experimental: {
      getFormatListJson: http.getJson("api/rest/view/v1/timetable/settings/format/list", {
        withSchoolYearHeader: false
      }),
      getGeneralSettingsJson: http.getJson("api/rest/view/v1/timetable/settings/general", {
        withSchoolYearHeader: false
      }),
      getVisibilityRestrictionJson: http.getJson("api/rest/view/v1/timetable/settings/visibilityRestriction", {
        withSchoolYearHeader: false
      })
    }
  };
});
