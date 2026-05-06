import { Context, Effect, Layer } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import type { TimeGrid } from "../shared/schema.ts";
import {
  type TimetableAvailableRoomsRequest,
  type TimetableCalendarRequest,
  type TimetableEntriesRequest,
  type TimetableEntriesSettingsRequest,
  type TimetableEntriesWeekOverviewRequest,
  type TimetableExternalCalendarRequest,
  type TimetableFilterRequest,
  type TimetableGridRequest,
  TimetableRequests,
  type TimetableSearchRequest,
} from "./requests.ts";
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
} from "./schema.ts";

export interface TimetableClientShape {
  readonly getTimeGrid: () => Effect.Effect<TimeGrid, RequestFailure>;
  readonly getGrid: (
    request?: TimetableGridRequest,
  ) => Effect.Effect<TimetableGrid, RequestFailure>;
  readonly getFilter: (
    request: TimetableFilterRequest,
  ) => Effect.Effect<TimetableFilter, RequestFailure>;
  readonly getEntriesSettings: (
    request: TimetableEntriesSettingsRequest,
  ) => Effect.Effect<TimetableEntriesSettings, RequestFailure>;
  readonly getMenu: () => Effect.Effect<TimetableMenu, RequestFailure>;
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

export class TimetableClient extends Context.Service<TimetableClient, TimetableClientShape>()(
  "webuntis/TimetableClient",
) {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return TimetableClient.of({
        getTimeGrid: Effect.fn("TimetableClient.getTimeGrid")(function* () {
          return yield* http.requestSchema(TimetableRequests.getTimeGrid, undefined);
        }),
        getGrid: Effect.fn("TimetableClient.getGrid")(function* (
          request: TimetableGridRequest = {},
        ) {
          return yield* http.requestSchema(TimetableRequests.getGrid, request);
        }),
        getFilter: Effect.fn("TimetableClient.getFilter")(function* (
          request: TimetableFilterRequest,
        ) {
          return yield* http.requestSchema(TimetableRequests.getFilter, request);
        }),
        getEntriesSettings: Effect.fn("TimetableClient.getEntriesSettings")(function* (
          request: TimetableEntriesSettingsRequest,
        ) {
          return yield* http.requestSchema(TimetableRequests.getEntriesSettings, request);
        }),
        getMenu: Effect.fn("TimetableClient.getMenu")(function* () {
          return yield* http.requestSchema(TimetableRequests.getMenu, undefined);
        }),
        getCalendar: Effect.fn("TimetableClient.getCalendar")(function* (
          request: TimetableCalendarRequest = {},
        ) {
          return yield* http.requestSchema(TimetableRequests.getCalendar, request);
        }),
        getExternalCalendar: Effect.fn("TimetableClient.getExternalCalendar")(function* (
          request: TimetableExternalCalendarRequest = {},
        ) {
          return yield* http.requestSchema(TimetableRequests.getExternalCalendar, request);
        }),
        search: Effect.fn("TimetableClient.search")(function* (request: TimetableSearchRequest) {
          return yield* http.requestSchema(TimetableRequests.search, request);
        }),
        getAvailableRooms: Effect.fn("TimetableClient.getAvailableRooms")(function* (
          request: TimetableAvailableRoomsRequest,
        ) {
          return yield* http.requestSchema(TimetableRequests.getAvailableRooms, request);
        }),
        getEntries: Effect.fn("TimetableClient.getEntries")(function* (
          request: TimetableEntriesRequest,
        ) {
          return yield* http.requestSchema(TimetableRequests.getEntries, request);
        }),
        getEntriesWeekOverview: Effect.fn("TimetableClient.getEntriesWeekOverview")(function* (
          request: TimetableEntriesWeekOverviewRequest,
        ) {
          return yield* http.requestSchema(TimetableRequests.getEntriesWeekOverview, request);
        }),
      });
    }),
  );
}

export type {
  TimetableAvailableRoomsRequest,
  TimetableCalendarRequest,
  TimetableEntriesRequest,
  TimetableEntriesSettingsRequest,
  TimetableEntriesWeekOverviewRequest,
  TimetableExternalCalendarRequest,
  TimetableFilterRequest,
  TimetableGridRequest,
  TimetableSearchRequest,
} from "./requests.ts";
