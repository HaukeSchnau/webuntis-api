import { Context, Effect, Layer } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import { AppRequests, type OnboardingRequest } from "./requests.ts";
import type {
  AppData,
  AppExamIntegrations,
  AppPlatformApplicationMenus,
  AppThirdPartyData,
  DashboardCards,
  DashboardCardsDetail,
  DashboardCardsStatus,
  Home,
  MobileData,
  Onboarding,
  StartupActions,
  TodayMeta,
} from "./schema.ts";

export interface AppClientShape {
  readonly getData: () => Effect.Effect<AppData, RequestFailure>;
  readonly getHome: () => Effect.Effect<Home, RequestFailure>;
  readonly getMobileData: () => Effect.Effect<MobileData, RequestFailure>;
  readonly getStartupActions: () => Effect.Effect<
    StartupActions,
    RequestFailure
  >;
  readonly getPlatformApplicationMenus: () => Effect.Effect<
    AppPlatformApplicationMenus,
    RequestFailure
  >;
  readonly getThirdPartyData: () => Effect.Effect<
    AppThirdPartyData,
    RequestFailure
  >;
  readonly getExamIntegrations: () => Effect.Effect<
    AppExamIntegrations,
    RequestFailure
  >;
  readonly getTodayMeta: () => Effect.Effect<TodayMeta, RequestFailure>;
  readonly getDashboardCards: () => Effect.Effect<
    DashboardCards,
    RequestFailure
  >;
  readonly getDashboardCardsDetail: () => Effect.Effect<
    DashboardCardsDetail,
    RequestFailure
  >;
  readonly getDashboardCardsStatus: () => Effect.Effect<
    DashboardCardsStatus,
    RequestFailure
  >;
  readonly getOnboarding: (
    request: OnboardingRequest,
  ) => Effect.Effect<Onboarding, RequestFailure>;
}

export class AppClient extends Context.Service<AppClient, AppClientShape>()(
  "webuntis/AppClient",
) {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return AppClient.of({
        getData: Effect.fn("AppClient.getData")(function* () {
          return yield* http.requestSchema(AppRequests.getData, undefined);
        }),
        getHome: Effect.fn("AppClient.getHome")(function* () {
          return yield* http.requestSchema(AppRequests.getHome, undefined);
        }),
        getMobileData: Effect.fn("AppClient.getMobileData")(function* () {
          return yield* http.requestSchema(
            AppRequests.getMobileData,
            undefined,
          );
        }),
        getStartupActions: Effect.fn("AppClient.getStartupActions")(
          function* () {
            return yield* http.requestSchema(
              AppRequests.getStartupActions,
              undefined,
            );
          },
        ),
        getPlatformApplicationMenus: Effect.fn(
          "AppClient.getPlatformApplicationMenus",
        )(function* () {
          return yield* http.requestSchema(
            AppRequests.getPlatformApplicationMenus,
            undefined,
          );
        }),
        getThirdPartyData: Effect.fn("AppClient.getThirdPartyData")(
          function* () {
            return yield* http.requestSchema(
              AppRequests.getThirdPartyData,
              undefined,
            );
          },
        ),
        getExamIntegrations: Effect.fn("AppClient.getExamIntegrations")(
          function* () {
            return yield* http.requestSchema(
              AppRequests.getExamIntegrations,
              undefined,
            );
          },
        ),
        getTodayMeta: Effect.fn("AppClient.getTodayMeta")(function* () {
          return yield* http.requestSchema(AppRequests.getTodayMeta, undefined);
        }),
        getDashboardCards: Effect.fn("AppClient.getDashboardCards")(
          function* () {
            return yield* http.requestSchema(
              AppRequests.getDashboardCards,
              undefined,
            );
          },
        ),
        getDashboardCardsDetail: Effect.fn("AppClient.getDashboardCardsDetail")(
          function* () {
            return yield* http.requestSchema(
              AppRequests.getDashboardCardsDetail,
              undefined,
            );
          },
        ),
        getDashboardCardsStatus: Effect.fn("AppClient.getDashboardCardsStatus")(
          function* () {
            return yield* http.requestSchema(
              AppRequests.getDashboardCardsStatus,
              undefined,
            );
          },
        ),
        getOnboarding: Effect.fn("AppClient.getOnboarding")(function* (
          request: OnboardingRequest,
        ) {
          return yield* http.requestSchema(AppRequests.getOnboarding, request);
        }),
      });
    }),
  );
}

export type { OnboardingRequest } from "./requests.ts";
