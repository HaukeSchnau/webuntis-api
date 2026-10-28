import { Context, Effect, Layer, Result, type Types } from "effect";
import { makeOperations } from "../../internal/domain.ts";
import type { InvalidRequestError, WebUntisError } from "../../internal/errors.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import { errorPathFor, validateInput } from "../../internal/request.ts";
import type { TimeGrid } from "../shared/schema.ts";
import {
  type TimetableAvailableRoomsRequest,
  type TimetableCalendarRequest,
  type TimetableEntriesForResourcesRequest,
  TimetableEntriesForResourcesInput,
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

/** One resource's outcome in {@link TimetableClientShape.getEntriesForResources}. */
export interface TimetableEntriesForResource {
  readonly resource: number;
  /**
   * The JSON body exactly as WebUntis sent it, including fields the schema
   * does not model. Present when requested and WebUntis answered with JSON,
   * also if decoding it then failed.
   */
  readonly raw?: unknown;
  readonly result: Result.Result<TimetableEntries, WebUntisError>;
}

export interface TimetableEntriesForResourcesOptions {
  /** Requests in flight at once. Defaults to 1; the connection's limits still apply. */
  readonly concurrency?: Types.Concurrency | undefined;
  /** Keep each response's JSON next to its decoded value. */
  readonly raw?: boolean | undefined;
}

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
  /**
   * Fetches entries for many resources, one request each, because WebUntis
   * accepts only one resource per entries request. A failing resource does not
   * fail the others; only invalid input fails the whole batch, before anything
   * is sent.
   */
  readonly getEntriesForResources: (
    request: TimetableEntriesForResourcesRequest,
    options?: TimetableEntriesForResourcesOptions,
  ) => Effect.Effect<ReadonlyArray<TimetableEntriesForResource>, InvalidRequestError>;
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
      const http = yield* WebUntisHttp;
      const { read, call, callOptional } = makeOperations(http, "TimetableClient");

      const entriesFor = (request: TimetableEntriesRequest, keepRaw: boolean) =>
        http.requestDecoded(TimetableRequests.getEntries, request).pipe(
          Effect.map(({ raw, decoded }): TimetableEntriesForResource =>
            keepRaw
              ? { resource: request.resource, raw, result: decoded }
              : { resource: request.resource, result: decoded },
          ),
          Effect.catch((error) =>
            Effect.succeed<TimetableEntriesForResource>({
              resource: request.resource,
              result: Result.fail(error),
            }),
          ),
        );

      const getEntriesForResources: TimetableClientShape["getEntriesForResources"] = (
        request,
        options = {},
      ) =>
        validateInput(
          TimetableEntriesForResourcesInput,
          errorPathFor(TimetableRequests.getEntries),
        )(request).pipe(
          Effect.flatMap(({ resources, ...shared }) =>
            Effect.forEach(
              resources,
              (resource) => entriesFor({ ...shared, resource }, options.raw === true),
              { concurrency: options.concurrency ?? 1 },
            ),
          ),
          Effect.withSpan("TimetableClient.getEntriesForResources"),
        );

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
        getEntriesForResources,
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
  TimetableEntriesForResourcesRequest,
  TimetableCalendarRequest,
  TimetableEntriesRequest,
  TimetableEntriesSettingsRequest,
  TimetableEntriesWeekOverviewRequest,
  TimetableExternalCalendarRequest,
  TimetableFilterRequest,
  TimetableGridRequest,
  TimetableSearchRequest,
};
