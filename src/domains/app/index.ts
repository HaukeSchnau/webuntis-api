import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import type {
  AppData,
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
} from "../schemas/app.ts";
import { AppRequests, type OnboardingRequest } from "./requests.ts";

export interface AppClientShape {
  readonly getData: Effect.Effect<AppData, RequestFailure>;
  readonly getHome: Effect.Effect<Home, RequestFailure>;
  readonly getMobileData: Effect.Effect<MobileData, RequestFailure>;
  readonly getStartupActions: Effect.Effect<StartupActions, RequestFailure>;
  readonly getPlatformApplicationMenus: Effect.Effect<
    AppPlatformApplicationMenus,
    RequestFailure
  >;
  readonly getThirdPartyData: Effect.Effect<AppThirdPartyData, RequestFailure>;
  readonly getTodayMeta: Effect.Effect<TodayMeta, RequestFailure>;
  readonly getDashboardCards: Effect.Effect<DashboardCards, RequestFailure>;
  readonly getDashboardCardsDetail: Effect.Effect<
    DashboardCardsDetail,
    RequestFailure
  >;
  readonly getDashboardCardsStatus: Effect.Effect<
    DashboardCardsStatus,
    RequestFailure
  >;
  readonly getOnboarding: (
    request: OnboardingRequest,
  ) => Effect.Effect<Onboarding, RequestFailure>;
}

export class AppClient extends ServiceMap.Service<AppClient, AppClientShape>()(
  "webuntis/AppClient",
) {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return AppClient.of({
        getData: http.requestSchema(AppRequests.getData, undefined),
        getHome: http.requestSchema(AppRequests.getHome, undefined),
        getMobileData: http.requestSchema(AppRequests.getMobileData, undefined),
        getStartupActions: http.requestSchema(
          AppRequests.getStartupActions,
          undefined,
        ),
        getPlatformApplicationMenus: http.requestSchema(
          AppRequests.getPlatformApplicationMenus,
          undefined,
        ),
        getThirdPartyData: http.requestSchema(
          AppRequests.getThirdPartyData,
          undefined,
        ),
        getTodayMeta: http.requestSchema(AppRequests.getTodayMeta, undefined),
        getDashboardCards: http.requestSchema(
          AppRequests.getDashboardCards,
          undefined,
        ),
        getDashboardCardsDetail: http.requestSchema(
          AppRequests.getDashboardCardsDetail,
          undefined,
        ),
        getDashboardCardsStatus: http.requestSchema(
          AppRequests.getDashboardCardsStatus,
          undefined,
        ),
        getOnboarding: (request) =>
          http.requestSchema(AppRequests.getOnboarding, request),
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}

export type { OnboardingRequest } from "./requests.ts";
