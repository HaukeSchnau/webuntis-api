import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import {
  TimeGridSchema,
  TimetableAvailableRoomsSchema,
  TimetableCalendarSchema,
  TimetableEntriesSchema,
  TimetableEntriesSettingsSchema,
  TimetableEntriesWeekOverviewSchema,
  TimetableExternalCalendarSchema,
  TimetableFilterSchema,
  TimetableGridSchema,
  TimetableMenuSchema,
  type TimetableResourceType,
  TimetableSearchSchema,
} from "./schema.ts";

export interface TimetableEntriesRequest {
  readonly start: string;
  readonly end: string;
  readonly resourceType: TimetableResourceType;
  readonly resources: ReadonlyArray<number>;
  readonly timetableType?: string | undefined;
  readonly format?: number | undefined;
  readonly layout?: string | undefined;
  readonly periodTypes?: string | undefined;
}

export interface TimetableFilterRequest {
  readonly start: string;
  readonly end: string;
  readonly resourceType: TimetableResourceType;
  readonly timetableType?: string | undefined;
}

export interface TimetableEntriesSettingsRequest {
  readonly resourceType: TimetableResourceType;
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

export interface TimetableExternalCalendarRequest {
  readonly myTimetable?: boolean | undefined;
}

export interface TimetableAvailableRoomsRequest {
  readonly startDateTime: string;
  readonly endDateTime: string;
}

export interface TimetableEntriesWeekOverviewRequest {
  readonly start: string;
  readonly end: string;
  readonly resourceType: TimetableResourceType;
  readonly resources: ReadonlyArray<number>;
  readonly timetableType?: string | undefined;
}

export interface TimetableGridRequest {
  readonly timetableType?: string | undefined;
}

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
    supportsSchoolYearScope: true,
    schema: TimetableEntriesWeekOverviewSchema,
  }),
} as const;
