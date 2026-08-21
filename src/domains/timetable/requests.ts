import { Schema } from "effect";
import {
  DateTimeString,
  IsoDate,
  NonBlankString,
  orderedDateTimeRange,
  orderedRange,
  PositiveInteger,
  RequestPolicy,
  schemaRequest,
} from "../../internal/request.ts";
import { TimeGridSchema } from "../shared/schema.ts";
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
  TimetableResourceTypeSchema,
  TimetableSearchSchema,
} from "./schema.ts";

const EntriesInputFields = {
  start: IsoDate,
  end: IsoDate,
  resourceType: TimetableResourceTypeSchema,
  resources: Schema.NonEmptyArray(PositiveInteger),
  timetableType: Schema.optional(NonBlankString),
} as const;

const TimetableEntriesInput = orderedRange(
  Schema.Struct({
    ...EntriesInputFields,
    format: Schema.optional(PositiveInteger),
    layout: Schema.optional(NonBlankString),
    periodTypes: Schema.optional(Schema.String),
  }),
);

const TimetableEntriesWeekOverviewInput = orderedRange(Schema.Struct(EntriesInputFields));

const TimetableFilterInput = orderedRange(
  Schema.Struct({
    start: IsoDate,
    end: IsoDate,
    resourceType: TimetableResourceTypeSchema,
    timetableType: Schema.optional(NonBlankString),
  }),
);

const TimetableEntriesSettingsInput = Schema.Struct({
  resourceType: TimetableResourceTypeSchema,
  format: Schema.optional(PositiveInteger),
});

const TimetableSearchInput = Schema.Struct({
  query: NonBlankString,
  schoolyear: PositiveInteger,
});

const TimetableCalendarInput = Schema.Struct({
  myTimetable: Schema.optional(Schema.Boolean),
  timetableType: Schema.optional(NonBlankString),
});

const TimetableExternalCalendarInput = Schema.Struct({
  myTimetable: Schema.optional(Schema.Boolean),
});

const TimetableAvailableRoomsInput = orderedDateTimeRange(
  Schema.Struct({
    startDateTime: DateTimeString,
    endDateTime: DateTimeString,
  }),
);

const TimetableGridInput = Schema.Struct({ timetableType: Schema.optional(NonBlankString) });

// Request types are derived from the schemas that validate them, so the two can
// never describe different shapes. Refinements such as `IsoDate` narrow values
// at runtime only; they stay `string` here.
export type TimetableEntriesRequest = typeof TimetableEntriesInput.Type;
export type TimetableEntriesWeekOverviewRequest = typeof TimetableEntriesWeekOverviewInput.Type;
export type TimetableFilterRequest = typeof TimetableFilterInput.Type;
export type TimetableEntriesSettingsRequest = typeof TimetableEntriesSettingsInput.Type;
export type TimetableSearchRequest = typeof TimetableSearchInput.Type;
export type TimetableCalendarRequest = typeof TimetableCalendarInput.Type;
export type TimetableExternalCalendarRequest = typeof TimetableExternalCalendarInput.Type;
export type TimetableAvailableRoomsRequest = typeof TimetableAvailableRoomsInput.Type;
export type TimetableGridRequest = typeof TimetableGridInput.Type;

export const TimetableRequests = {
  getTimeGrid: schemaRequest<void, typeof TimeGridSchema>({
    method: "GET",
    path: "api/rest/view/v1/timegrid",
    policy: RequestPolicy.AuthOnly,
    schema: TimeGridSchema,
  }),
  getGrid: schemaRequest<TimetableGridRequest, typeof TimetableGridSchema>({
    method: "GET",
    path: "api/rest/view/v1/timetable/grid",
    query: (request) => ({
      timetableType: request.timetableType ?? "STANDARD",
    }),
    policy: RequestPolicy.Metadata,
    inputSchema: TimetableGridInput,
    supportsSchoolYearScope: true,
    schema: TimetableGridSchema,
  }),
  getFilter: schemaRequest<TimetableFilterRequest, typeof TimetableFilterSchema>({
    method: "GET",
    path: "api/rest/view/v1/timetable/filter",
    query: (request) => ({
      resourceType: request.resourceType,
      timetableType: request.timetableType ?? "STANDARD",
      start: request.start,
      end: request.end,
    }),
    policy: RequestPolicy.Metadata,
    inputSchema: TimetableFilterInput,
    supportsSchoolYearScope: true,
    schema: TimetableFilterSchema,
  }),
  getEntriesSettings: schemaRequest<
    TimetableEntriesSettingsRequest,
    typeof TimetableEntriesSettingsSchema
  >({
    method: "GET",
    path: "api/rest/view/v1/timetable/entries/settings",
    query: (request) => ({
      format: request.format ?? 2,
      resourceType: request.resourceType,
    }),
    policy: RequestPolicy.Metadata,
    inputSchema: TimetableEntriesSettingsInput,
    supportsSchoolYearScope: true,
    schema: TimetableEntriesSettingsSchema,
  }),
  getMenu: schemaRequest<void, typeof TimetableMenuSchema>({
    method: "GET",
    path: "api/rest/view/v1/timetable/menu",
    policy: RequestPolicy.AuthOnly,
    schema: TimetableMenuSchema,
  }),
  getCalendar: schemaRequest<TimetableCalendarRequest, typeof TimetableCalendarSchema>({
    method: "GET",
    path: "api/rest/view/v1/timetable/calendar",
    query: (request) => ({
      myTimetable: request.myTimetable,
      timetableType: request.timetableType,
    }),
    policy: RequestPolicy.AuthOnly,
    inputSchema: TimetableCalendarInput,
    schema: TimetableCalendarSchema,
  }),
  getExternalCalendar: schemaRequest<
    TimetableExternalCalendarRequest,
    typeof TimetableExternalCalendarSchema
  >({
    method: "GET",
    path: "api/rest/view/v1/timetable/externalCalendar",
    query: (request) => ({
      myTimetable: request.myTimetable,
    }),
    policy: RequestPolicy.AuthOnly,
    inputSchema: TimetableExternalCalendarInput,
    schema: TimetableExternalCalendarSchema,
  }),
  search: schemaRequest<TimetableSearchRequest, typeof TimetableSearchSchema>({
    method: "GET",
    path: "api/rest/view/v1/timetable/search",
    query: (request) => ({
      q: request.query,
      schoolyear: request.schoolyear,
    }),
    policy: RequestPolicy.AuthOnly,
    inputSchema: TimetableSearchInput,
    supportsSchoolYearScope: true,
    schema: TimetableSearchSchema,
  }),
  getAvailableRooms: schemaRequest<
    TimetableAvailableRoomsRequest,
    typeof TimetableAvailableRoomsSchema
  >({
    method: "GET",
    path: "api/rest/view/v2/timetable/availableRooms",
    query: (request) => ({
      startDateTime: request.startDateTime,
      endDateTime: request.endDateTime,
    }),
    policy: RequestPolicy.AuthOnly,
    inputSchema: TimetableAvailableRoomsInput,
    supportsSchoolYearScope: true,
    schema: TimetableAvailableRoomsSchema,
  }),
  getEntries: schemaRequest<TimetableEntriesRequest, typeof TimetableEntriesSchema>({
    method: "GET",
    path: "api/rest/view/v1/timetable/entries",
    query: (request) => ({
      start: request.start,
      end: request.end,
      format: request.format ?? 2,
      resourceType: request.resourceType,
      resources: request.resources.join(","),
      periodTypes: request.periodTypes ?? "",
      timetableType: request.timetableType ?? "STANDARD",
      layout: request.layout ?? "START_TIME",
    }),
    policy: RequestPolicy.Metadata,
    inputSchema: TimetableEntriesInput,
    supportsSchoolYearScope: true,
    schema: TimetableEntriesSchema,
  }),
  getEntriesWeekOverview: schemaRequest<
    TimetableEntriesWeekOverviewRequest,
    typeof TimetableEntriesWeekOverviewSchema
  >({
    method: "GET",
    path: "api/rest/view/v1/timetable/entriesWeekOverview",
    query: (request) => ({
      start: request.start,
      end: request.end,
      resourceType: request.resourceType,
      resources: request.resources.join(","),
      timetableType: request.timetableType,
    }),
    policy: RequestPolicy.Metadata,
    inputSchema: TimetableEntriesWeekOverviewInput,
    supportsSchoolYearScope: true,
    schema: TimetableEntriesWeekOverviewSchema,
  }),
} as const;
