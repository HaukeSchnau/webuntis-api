import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import type { TimeGrid } from "../schemas/shared.ts";
import type {
  TimetableAvailableRooms,
  TimetableCalendar,
  TimetableEntries,
  TimetableEntriesSettings,
  TimetableEntriesWeekOverview,
  TimetableExternalCalendar,
  TimetableFilter,
  TimetableGrid,
  TimetableMenu,
  TimetableSearch,
} from "../schemas/timetable.ts";
import {
  type TimetableAvailableRoomsRequest,
  type TimetableCalendarRequest,
  type TimetableEntriesRequest,
  type TimetableEntriesSettingsRequest,
  type TimetableEntriesWeekOverviewRequest,
  type TimetableExternalCalendarRequest,
  type TimetableFilterRequest,
  TimetableRequests,
  type TimetableSearchRequest,
} from "./requests.ts";

export interface TimetableClientShape {
  readonly getTimeGrid: Effect.Effect<TimeGrid, RequestFailure>;
  readonly getGrid: (
    timetableType?: string,
  ) => Effect.Effect<TimetableGrid, RequestFailure>;
  readonly getFilter: (
    request: TimetableFilterRequest,
  ) => Effect.Effect<TimetableFilter, RequestFailure>;
  readonly getEntriesSettings: (
    request: TimetableEntriesSettingsRequest,
  ) => Effect.Effect<TimetableEntriesSettings, RequestFailure>;
  readonly getMenu: Effect.Effect<TimetableMenu, RequestFailure>;
  readonly getCalendar: (
    request?: TimetableCalendarRequest,
  ) => Effect.Effect<TimetableCalendar, RequestFailure>;
  readonly getExternalCalendar: (
    request?: TimetableExternalCalendarRequest,
  ) => Effect.Effect<TimetableExternalCalendar, RequestFailure>;
  readonly search: (
    request: TimetableSearchRequest,
  ) => Effect.Effect<TimetableSearch, RequestFailure>;
  readonly getAvailableRooms: (
    request: TimetableAvailableRoomsRequest,
  ) => Effect.Effect<TimetableAvailableRooms, RequestFailure>;
  readonly getEntries: (
    request: TimetableEntriesRequest,
  ) => Effect.Effect<TimetableEntries, RequestFailure>;
  readonly getEntriesWeekOverview: (
    request: TimetableEntriesWeekOverviewRequest,
  ) => Effect.Effect<TimetableEntriesWeekOverview, RequestFailure>;
}

export class TimetableClient extends ServiceMap.Service<
  TimetableClient,
  TimetableClientShape
>()("webuntis/TimetableClient") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return TimetableClient.of({
        getTimeGrid: http.requestSchema(
          TimetableRequests.getTimeGrid,
          undefined,
        ),
        getGrid: (timetableType) =>
          http.requestSchema(TimetableRequests.getGrid, timetableType),
        getFilter: (request) =>
          http.requestSchema(TimetableRequests.getFilter, request),
        getEntriesSettings: (request) =>
          http.requestSchema(TimetableRequests.getEntriesSettings, request),
        getMenu: http.requestSchema(TimetableRequests.getMenu, undefined),
        getCalendar: (request = {}) =>
          http.requestSchema(TimetableRequests.getCalendar, request),
        getExternalCalendar: (request = {}) =>
          http.requestSchema(TimetableRequests.getExternalCalendar, request),
        search: (request) =>
          http.requestSchema(TimetableRequests.search, request),
        getAvailableRooms: (request) =>
          http.requestSchema(TimetableRequests.getAvailableRooms, request),
        getEntries: (request) =>
          http.requestSchema(TimetableRequests.getEntries, request),
        getEntriesWeekOverview: (request) =>
          http.requestSchema(TimetableRequests.getEntriesWeekOverview, request),
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}

export type {
  TimetableAvailableRoomsRequest,
  TimetableCalendarRequest,
  TimetableEntriesRequest,
  TimetableEntriesSettingsRequest,
  TimetableEntriesWeekOverviewRequest,
  TimetableExternalCalendarRequest,
  TimetableFilterRequest,
  TimetableSearchRequest,
} from "./requests.ts";
