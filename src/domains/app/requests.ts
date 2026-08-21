import { Schema } from "effect";
import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import {
  AppDataSchema,
  AppExamIntegrationsSchema,
  AppPlatformApplicationMenusSchema,
  AppThirdPartyDataSchema,
  DashboardCardsDetailSchema,
  DashboardCardsSchema,
  DashboardCardsStatusSchema,
  HomeSchema,
  MobileDataSchema,
  OnboardingSchema,
  OnboardingTypeSchema,
  StartupActionsSchema,
  TodayMetaSchema,
} from "./schema.ts";

const OnboardingInput = Schema.Struct({ type: OnboardingTypeSchema });

export type OnboardingRequest = typeof OnboardingInput.Type;

export const AppRequests = {
  getData: schemaRequest<void, typeof AppDataSchema>({
    method: "GET",
    path: "api/rest/view/v1/app/data",
    policy: RequestPolicy.AuthOnly,
    schema: AppDataSchema,
  }),
  getHome: schemaRequest<void, typeof HomeSchema>({
    method: "GET",
    path: "api/rest/view/v2/home",
    policy: RequestPolicy.AuthOnly,
    schema: HomeSchema,
  }),
  getMobileData: schemaRequest<void, typeof MobileDataSchema>({
    method: "GET",
    path: "api/rest/view/v3/mobile/data",
    policy: RequestPolicy.AuthOnly,
    schema: MobileDataSchema,
  }),
  getStartupActions: schemaRequest<void, typeof StartupActionsSchema>({
    method: "GET",
    path: "api/rest/view/v2/trigger/startup",
    policy: RequestPolicy.AuthOnly,
    schema: StartupActionsSchema,
  }),
  getPlatformApplicationMenus: schemaRequest<void, typeof AppPlatformApplicationMenusSchema>({
    method: "GET",
    path: "api/rest/view/v1/app/platform-application/menus",
    policy: RequestPolicy.AuthOnly,
    schema: AppPlatformApplicationMenusSchema,
  }),
  getThirdPartyData: schemaRequest<void, typeof AppThirdPartyDataSchema>({
    method: "GET",
    path: "api/rest/view/v1/app/third-party/data",
    policy: RequestPolicy.AuthOnly,
    schema: AppThirdPartyDataSchema,
  }),
  getExamIntegrations: schemaRequest<void, typeof AppExamIntegrationsSchema>({
    method: "GET",
    path: "api/rest/view/v1/app/platform-application/exam-integrations",
    policy: RequestPolicy.AuthOnly,
    schema: AppExamIntegrationsSchema,
  }),
  getTodayMeta: schemaRequest<void, typeof TodayMetaSchema>({
    method: "GET",
    path: "api/rest/view/v1/today/meta",
    policy: RequestPolicy.AuthOnly,
    schema: TodayMetaSchema,
  }),
  getDashboardCards: schemaRequest<void, typeof DashboardCardsSchema>({
    method: "GET",
    path: "api/rest/view/v1/dashboard/cards",
    policy: RequestPolicy.AuthOnly,
    schema: DashboardCardsSchema,
  }),
  getDashboardCardsDetail: schemaRequest<void, typeof DashboardCardsDetailSchema>({
    method: "GET",
    path: "api/rest/view/v1/dashboard/cards/detail",
    policy: RequestPolicy.AuthOnly,
    schema: DashboardCardsDetailSchema,
  }),
  getDashboardCardsStatus: schemaRequest<void, typeof DashboardCardsStatusSchema>({
    method: "GET",
    path: "api/rest/view/v1/dashboard/cards/status",
    policy: RequestPolicy.AuthOnly,
    schema: DashboardCardsStatusSchema,
  }),
  getOnboarding: schemaRequest<OnboardingRequest, typeof OnboardingSchema>({
    method: "GET",
    path: "api/rest/view/v1/onboarding",
    policy: RequestPolicy.AuthOnly,
    query: (request) => ({ type: request.type }),
    inputSchema: OnboardingInput,
    schema: OnboardingSchema,
  }),
} as const;
