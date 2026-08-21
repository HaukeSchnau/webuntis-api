import { Context, Effect, Layer } from "effect";
import { makeOperations } from "../../internal/domain.ts";
import type { WebUntisError } from "../../internal/errors.ts";
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
  readonly getTimeGrid: Effect.Effect<TimeGrid, WebUntisError>;
  readonly getGrid: (request?: TimetableGridRequest) => Effect.Effect<TimetableGrid, WebUntisError>;
  readonly getFilter: (
    request: TimetableFilterRequest,
  ) => Effect.Effect<TimetableFilter, WebUntisError>;
  readonly getEntriesSettings: (
    request: TimetableEntriesSettingsRequest,
  ) => Effect.Effect<TimetableEntriesSettings, WebUntisError>;
  readonly getMenu: Effect.Effect<TimetableMenu, WebUntisError>;
  readonly getCalendar: (
    request?: TimetableCalendarRequest,
  ) => Effect.Effect<TimetableCalendar, WebUntisError>;
  readonly getExternalCalendar: (
    request?: TimetableExternalCalendarRequest,
  ) => Effect.Effect<TimetableExternalCalendar, WebUntisError>;
  readonly search: (
    request: TimetableSearchRequest,
  ) => Effect.Effect<TimetableSearch, WebUntisError>;
  readonly getAvailableRooms: (
    request: TimetableAvailableRoomsRequest,
  ) => Effect.Effect<TimetableAvailableRooms, WebUntisError>;
  readonly getEntries: (
    request: TimetableEntriesRequest,
  ) => Effect.Effect<TimetableEntries, WebUntisError>;
  readonly getEntriesWeekOverview: (
    request: TimetableEntriesWeekOverviewRequest,
  ) => Effect.Effect<TimetableEntriesWeekOverview, WebUntisError>;
}

export class TimetableClient extends Context.Service<TimetableClient, TimetableClientShape>()(
  "webuntis/TimetableClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { read, call, callOptional } = makeOperations(yield* WebUntisHttp, "TimetableClient");

      return TimetableClient.of({
        getTimeGrid: read("getTimeGrid", TimetableRequests.getTimeGrid),
        getGrid: callOptional("getGrid", TimetableRequests.getGrid, {}),
        getFilter: call("getFilter", TimetableRequests.getFilter),
        getEntriesSettings: call("getEntriesSettings", TimetableRequests.getEntriesSettings),
        getMenu: read("getMenu", TimetableRequests.getMenu),
        getCalendar: callOptional("getCalendar", TimetableRequests.getCalendar, {}),
        getExternalCalendar: callOptional(
          "getExternalCalendar",
          TimetableRequests.getExternalCalendar,
          {},
        ),
        search: call("search", TimetableRequests.search),
        getAvailableRooms: call("getAvailableRooms", TimetableRequests.getAvailableRooms),
        getEntries: call("getEntries", TimetableRequests.getEntries),
        getEntriesWeekOverview: call(
          "getEntriesWeekOverview",
          TimetableRequests.getEntriesWeekOverview,
        ),
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
};
