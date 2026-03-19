import { Effect } from "effect";
import { type RequestFailure, WebUntisHttp } from "../core/http.ts";
import {
  AppDataSchema,
  AppPlatformApplicationMenusSchema,
  AppThirdPartyDataSchema,
  type AppData,
  type AppPlatformApplicationMenus,
  type AppThirdPartyData,
  DashboardCardsDetailSchema,
  DashboardCardsSchema,
  DashboardCardsStatusSchema,
  type DashboardCards,
  type DashboardCardsDetail,
  type DashboardCardsStatus,
  HomeSchema,
  type Home,
  MobileDataSchema,
  type MobileData,
  OnboardingSchema,
  type Onboarding,
  type OnboardingType,
  StartupActionsSchema,
  type StartupActions,
  TodayMetaSchema,
  type TodayMeta
} from "./schemas/app.ts";

export interface OnboardingRequest {
  readonly type: OnboardingType;
}

export interface AppClient {
  readonly getData: Effect.Effect<AppData, RequestFailure>;
  readonly getHome: Effect.Effect<Home, RequestFailure>;
  readonly getMobileData: Effect.Effect<MobileData, RequestFailure>;
  readonly getStartupActions: Effect.Effect<StartupActions, RequestFailure>;
  readonly getPlatformApplicationMenus: Effect.Effect<AppPlatformApplicationMenus, RequestFailure>;
  readonly getThirdPartyData: Effect.Effect<AppThirdPartyData, RequestFailure>;
  readonly getTodayMeta: Effect.Effect<TodayMeta, RequestFailure>;
  readonly getDashboardCards: Effect.Effect<DashboardCards, RequestFailure>;
  readonly getDashboardCardsDetail: Effect.Effect<DashboardCardsDetail, RequestFailure>;
  readonly getDashboardCardsStatus: Effect.Effect<DashboardCardsStatus, RequestFailure>;
  readonly getOnboarding: (request: OnboardingRequest) => Effect.Effect<Onboarding, RequestFailure>;
}

export const makeAppClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getData: http.getSchema("api/rest/view/v1/app/data", AppDataSchema, {
      withSchoolYearHeader: false
    }),
    getHome: http.getSchema("api/rest/view/v2/home", HomeSchema, {
      withSchoolYearHeader: false
    }),
    getMobileData: http.getSchema("api/rest/view/v3/mobile/data", MobileDataSchema, {
      withSchoolYearHeader: false
    }),
    getStartupActions: http.getSchema("api/rest/view/v2/trigger/startup", StartupActionsSchema, {
      withSchoolYearHeader: false
    }),
    getPlatformApplicationMenus: http.getSchema(
      "api/rest/view/v1/app/platform-application/menus",
      AppPlatformApplicationMenusSchema,
      { withSchoolYearHeader: false }
    ),
    getThirdPartyData: http.getSchema("api/rest/view/v1/app/third-party/data", AppThirdPartyDataSchema, {
      withSchoolYearHeader: false
    }),
    getTodayMeta: http.getSchema("api/rest/view/v1/today/meta", TodayMetaSchema, {
      withSchoolYearHeader: false
    }),
    getDashboardCards: http.getSchema("api/rest/view/v1/dashboard/cards", DashboardCardsSchema, {
      withSchoolYearHeader: false
    }),
    getDashboardCardsDetail: http.getSchema("api/rest/view/v1/dashboard/cards/detail", DashboardCardsDetailSchema, {
      withSchoolYearHeader: false
    }),
    getDashboardCardsStatus: http.getSchema("api/rest/view/v1/dashboard/cards/status", DashboardCardsStatusSchema, {
      withSchoolYearHeader: false
    }),
    getOnboarding: (request: OnboardingRequest) =>
      http.getSchema("api/rest/view/v1/onboarding", OnboardingSchema, {
        query: { type: request.type },
        withSchoolYearHeader: false
      })
  };
});
