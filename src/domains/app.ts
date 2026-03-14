import { Effect } from "effect";
import { SessionStore } from "../core/session-store.ts";
import { WebUntisHttp } from "../core/http.ts";
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
} from "./schemas.ts";

export interface OnboardingRequest {
  readonly type: OnboardingType;
}

export interface AppClient {
  readonly getData: Effect.Effect<AppData, unknown>;
  readonly getHome: Effect.Effect<Home, unknown>;
  readonly getMobileData: Effect.Effect<MobileData, unknown>;
  readonly getStartupActions: Effect.Effect<StartupActions, unknown>;
  readonly getPlatformApplicationMenus: Effect.Effect<AppPlatformApplicationMenus, unknown>;
  readonly getThirdPartyData: Effect.Effect<AppThirdPartyData, unknown>;
  readonly getTodayMeta: Effect.Effect<TodayMeta, unknown>;
  readonly getDashboardCards: Effect.Effect<DashboardCards, unknown>;
  readonly getDashboardCardsDetail: Effect.Effect<DashboardCardsDetail, unknown>;
  readonly getDashboardCardsStatus: Effect.Effect<DashboardCardsStatus, unknown>;
  readonly getOnboarding: (request: OnboardingRequest) => Effect.Effect<Onboarding, unknown>;
}

export const makeAppClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;
  const sessionStore = yield* SessionStore;

  const getData = http.getSchema("api/rest/view/v1/app/data", AppDataSchema, {
    withSchoolYearHeader: false
  }).pipe(
    Effect.tap((appData) =>
      sessionStore.update((state) => ({
        ...state,
        tenantId: state.tenantId ?? appData.tenant.id,
        schoolYearId: appData.currentSchoolYear.id
      }))
    )
  );

  return {
    getData,
    getHome: http.getSchema("api/rest/view/v1/home", HomeSchema, {
      withSchoolYearHeader: false
    }),
    getMobileData: http.getSchema("api/rest/view/v1/mobile/data", MobileDataSchema, {
      withSchoolYearHeader: false
    }),
    getStartupActions: http.getSchema("api/rest/view/v1/trigger/startup", StartupActionsSchema, {
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
