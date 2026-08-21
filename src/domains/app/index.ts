import { Context, Effect, Layer } from "effect";
import { makeOperations } from "../../internal/domain.ts";
import type { WebUntisError } from "../../internal/errors.ts";
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
  readonly getData: Effect.Effect<AppData, WebUntisError>;
  readonly getHome: Effect.Effect<Home, WebUntisError>;
  readonly getMobileData: Effect.Effect<MobileData, WebUntisError>;
  readonly getStartupActions: Effect.Effect<StartupActions, WebUntisError>;
  readonly getPlatformApplicationMenus: Effect.Effect<AppPlatformApplicationMenus, WebUntisError>;
  readonly getThirdPartyData: Effect.Effect<AppThirdPartyData, WebUntisError>;
  readonly getExamIntegrations: Effect.Effect<AppExamIntegrations, WebUntisError>;
  readonly getTodayMeta: Effect.Effect<TodayMeta, WebUntisError>;
  readonly getDashboardCards: Effect.Effect<DashboardCards, WebUntisError>;
  readonly getDashboardCardsDetail: Effect.Effect<DashboardCardsDetail, WebUntisError>;
  readonly getDashboardCardsStatus: Effect.Effect<DashboardCardsStatus, WebUntisError>;
  readonly getOnboarding: (request: OnboardingRequest) => Effect.Effect<Onboarding, WebUntisError>;
}

export class AppClient extends Context.Service<AppClient, AppClientShape>()("webuntis/AppClient") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { read, call } = makeOperations(yield* WebUntisHttp, "AppClient");

      return AppClient.of({
        getData: read("getData", AppRequests.getData),
        getHome: read("getHome", AppRequests.getHome),
        getMobileData: read("getMobileData", AppRequests.getMobileData),
        getStartupActions: read("getStartupActions", AppRequests.getStartupActions),
        getPlatformApplicationMenus: read(
          "getPlatformApplicationMenus",
          AppRequests.getPlatformApplicationMenus,
        ),
        getThirdPartyData: read("getThirdPartyData", AppRequests.getThirdPartyData),
        getExamIntegrations: read("getExamIntegrations", AppRequests.getExamIntegrations),
        getTodayMeta: read("getTodayMeta", AppRequests.getTodayMeta),
        getDashboardCards: read("getDashboardCards", AppRequests.getDashboardCards),
        getDashboardCardsDetail: read(
          "getDashboardCardsDetail",
          AppRequests.getDashboardCardsDetail,
        ),
        getDashboardCardsStatus: read(
          "getDashboardCardsStatus",
          AppRequests.getDashboardCardsStatus,
        ),
        getOnboarding: call("getOnboarding", AppRequests.getOnboarding),
      });
    }),
  );
}

export type { OnboardingRequest };
