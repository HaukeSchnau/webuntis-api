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
  readonly getData: Effect.Effect<AppData, RequestFailure>;
  readonly getHome: Effect.Effect<Home, RequestFailure>;
  readonly getMobileData: Effect.Effect<MobileData, RequestFailure>;
  readonly getStartupActions: Effect.Effect<StartupActions, RequestFailure>;
  readonly getPlatformApplicationMenus: Effect.Effect<AppPlatformApplicationMenus, RequestFailure>;
  readonly getThirdPartyData: Effect.Effect<AppThirdPartyData, RequestFailure>;
  readonly getExamIntegrations: Effect.Effect<AppExamIntegrations, RequestFailure>;
  readonly getTodayMeta: Effect.Effect<TodayMeta, RequestFailure>;
  readonly getDashboardCards: Effect.Effect<DashboardCards, RequestFailure>;
  readonly getDashboardCardsDetail: Effect.Effect<DashboardCardsDetail, RequestFailure>;
  readonly getDashboardCardsStatus: Effect.Effect<DashboardCardsStatus, RequestFailure>;
  readonly getOnboarding: (request: OnboardingRequest) => Effect.Effect<Onboarding, RequestFailure>;
}

export class AppClient extends Context.Service<AppClient, AppClientShape>()("webuntis/AppClient") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return AppClient.of({
        getData: http
          .requestSchema(AppRequests.getData, undefined)
          .pipe(Effect.withSpan("AppClient.getData")),
        getHome: http
          .requestSchema(AppRequests.getHome, undefined)
          .pipe(Effect.withSpan("AppClient.getHome")),
        getMobileData: http
          .requestSchema(AppRequests.getMobileData, undefined)
          .pipe(Effect.withSpan("AppClient.getMobileData")),
        getStartupActions: http
          .requestSchema(AppRequests.getStartupActions, undefined)
          .pipe(Effect.withSpan("AppClient.getStartupActions")),
        getPlatformApplicationMenus: http
          .requestSchema(AppRequests.getPlatformApplicationMenus, undefined)
          .pipe(Effect.withSpan("AppClient.getPlatformApplicationMenus")),
        getThirdPartyData: http
          .requestSchema(AppRequests.getThirdPartyData, undefined)
          .pipe(Effect.withSpan("AppClient.getThirdPartyData")),
        getExamIntegrations: http
          .requestSchema(AppRequests.getExamIntegrations, undefined)
          .pipe(Effect.withSpan("AppClient.getExamIntegrations")),
        getTodayMeta: http
          .requestSchema(AppRequests.getTodayMeta, undefined)
          .pipe(Effect.withSpan("AppClient.getTodayMeta")),
        getDashboardCards: http
          .requestSchema(AppRequests.getDashboardCards, undefined)
          .pipe(Effect.withSpan("AppClient.getDashboardCards")),
        getDashboardCardsDetail: http
          .requestSchema(AppRequests.getDashboardCardsDetail, undefined)
          .pipe(Effect.withSpan("AppClient.getDashboardCardsDetail")),
        getDashboardCardsStatus: http
          .requestSchema(AppRequests.getDashboardCardsStatus, undefined)
          .pipe(Effect.withSpan("AppClient.getDashboardCardsStatus")),
        getOnboarding: Effect.fn("AppClient.getOnboarding")(function* (request: OnboardingRequest) {
          return yield* http.requestSchema(AppRequests.getOnboarding, request);
        }),
      });
    }),
  );
}

export type { OnboardingRequest } from "./requests.ts";
