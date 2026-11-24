import { Schema } from "effect";
import { EntityId } from "../../internal/schema.ts";
import {
  HolidaySchema,
  JsonObjectSchema,
  SchoolyearSchema,
  SchoolyearWithTimeGridSchema,
  TenantSchema,
  UserSchema,
} from "../shared/schema.ts";

export const AppDataSchema = Schema.Struct({
  departments: JsonObjectSchema.pipe(Schema.Array, Schema.optional),
  currentSchoolYear: Schema.NullOr(SchoolyearWithTimeGridSchema),
  tenant: TenantSchema,
  user: UserSchema,
  permissions: Schema.Array(Schema.String),
  settings: Schema.Array(Schema.String),
  holidays: Schema.Array(HolidaySchema),
  isPlayground: Schema.optional(Schema.Boolean),
  oneDriveData: Schema.optional(
    Schema.Struct({
      hasOneDriveRight: Schema.Boolean,
      oneDriveClientVersion: Schema.String,
      oneDriveClientId: Schema.String,
    }),
  ),
  ui2020: Schema.optional(Schema.Boolean),
  pollingJobs: JsonObjectSchema.pipe(Schema.Array, Schema.optional),
  isSupportAccessOpen: Schema.optional(Schema.Boolean),
  licenceExpiresAt: Schema.optional(Schema.String),
});

export type AppData = typeof AppDataSchema.Type;

export const AppPlatformApplicationMenuSchema = Schema.Struct({
  icon: Schema.String,
  id: EntityId,
  logoutUrl: Schema.NullOr(Schema.String),
  name: Schema.String,
  openInNewTab: Schema.Boolean,
  redirectUrl: Schema.String,
});

export const AppPlatformApplicationMenusSchema = Schema.Array(AppPlatformApplicationMenuSchema);

export type AppPlatformApplicationMenu = typeof AppPlatformApplicationMenuSchema.Type;

export type AppPlatformApplicationMenus = typeof AppPlatformApplicationMenusSchema.Type;

export const AppThirdPartyDataSchema = Schema.Struct({
  playgroundUrl: Schema.NullOr(Schema.String),
  sleekplanToken: Schema.String,
});

export type AppThirdPartyData = typeof AppThirdPartyDataSchema.Type;

export const AppExamIntegrationRoleSchema = Schema.Literals([
  "ADMIN",
  "STUDENT",
  "PARENT",
  "DIRECTORATE",
  "STAFF",
  "TEACHER",
  "OTHER",
  "DEFAULT",
]);

export type AppExamIntegrationRole = typeof AppExamIntegrationRoleSchema.Type;

export const AppExamIntegrationViewTypeSchema = Schema.Literals(["OVERVIEW", "DETAIL", "EXAMLIST"]);

export type AppExamIntegrationViewType = typeof AppExamIntegrationViewTypeSchema.Type;

export const AppExamIntegrationSchema = Schema.Struct({
  active: Schema.optional(Schema.Boolean),
  id: EntityId,
  menuName: Schema.String,
  mobileAppLink: Schema.optional(Schema.Boolean),
  mobileView: Schema.optional(Schema.Boolean),
  openInTab: Schema.Boolean,
  role: AppExamIntegrationRoleSchema,
  url: Schema.String,
  viewType: AppExamIntegrationViewTypeSchema,
});

export const AppExamIntegrationsSchema = Schema.Array(AppExamIntegrationSchema);

export type AppExamIntegration = typeof AppExamIntegrationSchema.Type;

export type AppExamIntegrations = typeof AppExamIntegrationsSchema.Type;

export const DashboardCardSchema = Schema.Struct({
  hasAttachments: Schema.Boolean,
  headerColor: Schema.String,
  icon: Schema.String,
  id: EntityId,
  orderNo: Schema.Int,
  status: Schema.String,
  subtitle: Schema.String,
  title: Schema.String,
});

export type DashboardCard = typeof DashboardCardSchema.Type;

export const DashboardCardsSchema = Schema.Struct({
  dashboardCards: Schema.Array(DashboardCardSchema),
});

export type DashboardCards = typeof DashboardCardsSchema.Type;

export const DashboardCardsDetailItemSchema = Schema.Struct({
  attachments: Schema.Array(JsonObjectSchema),
  canDelete: Schema.Boolean,
  canEdit: Schema.Boolean,
  color: Schema.String,
  content: Schema.String,
  icon: Schema.String,
  id: EntityId,
  status: Schema.String,
  subtitle: Schema.String,
  title: Schema.String,
});

export type DashboardCardsDetailItem = typeof DashboardCardsDetailItemSchema.Type;

export const DashboardCardsDetailSchema = Schema.Struct({
  dashboardCardsDetails: Schema.Array(DashboardCardsDetailItemSchema),
});

export type DashboardCardsDetail = typeof DashboardCardsDetailSchema.Type;

export const DashboardCardsStatusSchema = Schema.Struct({
  unreadCardsCount: Schema.Int,
});

export type DashboardCardsStatus = typeof DashboardCardsStatusSchema.Type;

export const TodayMetaSchema = Schema.Struct({
  greetingName: Schema.String,
  calendar: Schema.NullOr(JsonObjectSchema),
});

export type TodayMeta = typeof TodayMetaSchema.Type;

export const HomeCellTypeSchema = Schema.Literals([
  "MY_EVENTS",
  "CLASS_TEACHER",
  "PARENTS_DAYS",
  "CONTACT_HOURS",
  "STUDENT_ABSENCES",
  "STUDENT_ABSENCES_ADMINISTRATION",
  "TEACHER_ABSENCES",
  "SUBSTITUTION_REQUESTS",
]);

export type HomeCellType = typeof HomeCellTypeSchema.Type;

export const HomeCellSchema = Schema.Struct({
  badge: Schema.NullOr(JsonObjectSchema),
  type: HomeCellTypeSchema,
});

export type HomeCell = typeof HomeCellSchema.Type;

export const HomeSectionSchema = Schema.Struct({
  cells: Schema.Array(HomeCellSchema),
});

export type HomeSection = typeof HomeSectionSchema.Type;

export const HomeSchema = Schema.Struct({
  schoolName: Schema.String,
  sections: Schema.Array(HomeSectionSchema),
  integrationsSection: Schema.Array(JsonObjectSchema),
  isEmailUpdateRequired: Schema.Boolean,
});

export type Home = typeof HomeSchema.Type;

export const MobileTenantSchema = Schema.Struct({
  id: Schema.String,
  displayName: Schema.String,
  wuVersion: Schema.String,
  language: Schema.String,
  schoolLoginName: Schema.String,
});

export type MobileTenant = typeof MobileTenantSchema.Type;

export const MobileTenantV1V2Schema = Schema.Struct({
  id: Schema.String,
  displayName: Schema.String,
  wuVersion: Schema.String,
  language: Schema.String,
});

export type MobileTenantV1V2 = typeof MobileTenantV1V2Schema.Type;

export const MobilePermissionSchema = Schema.Literals([
  "READ_MESSAGES",
  "WRITE_OWN_ABSENCES",
  "WRITE_OWN_ABSENCE_REASON",
  "CLASS_REGISTER",
  "CHANGE_OWN_PASSWORD",
]);

export type MobilePermission = typeof MobilePermissionSchema.Type;

export const MobileUserSchema = Schema.Struct({
  id: EntityId,
  username: Schema.String,
  person: Schema.NullOr(JsonObjectSchema),
  referencedStudents: Schema.Array(JsonObjectSchema),
  locale: Schema.String,
  departmentId: EntityId,
  role: Schema.String,
  permissions: Schema.Array(MobilePermissionSchema),
});

export type MobileUser = typeof MobileUserSchema.Type;

export const MobileDataV1V2Schema = Schema.Struct({
  schoolYear: Schema.NullOr(SchoolyearSchema),
  tenant: MobileTenantV1V2Schema,
  user: MobileUserSchema,
});

export const MobileDataSchema = Schema.Struct({
  schoolYear: Schema.NullOr(SchoolyearSchema),
  tenant: MobileTenantSchema,
  user: MobileUserSchema,
});

export type MobileDataV1V2 = typeof MobileDataV1V2Schema.Type;

export type MobileData = typeof MobileDataSchema.Type;

export const StartupActionsSchema = Schema.Struct({
  startupActions: Schema.Array(
    Schema.Literals(["VERIFY_PROFILE_DATA", "FORCE_ADMIN_DETAIL_CHANGE"]),
  ),
});

export type StartupActions = typeof StartupActionsSchema.Type;

export const OnboardingTypeSchema = Schema.Literals(["TIMETABLE"]);

export const OnboardingSchema = Schema.Struct({
  type: OnboardingTypeSchema,
  time: Schema.String,
  step: Schema.String,
});

export type Onboarding = typeof OnboardingSchema.Type;

export type OnboardingType = Onboarding["type"];
