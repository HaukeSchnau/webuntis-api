import { Schema } from "effect";
import {
  HolidaySchema,
  SchoolyearSchema,
  SchoolyearWithTimeGridSchema,
  TenantSchema,
  UserSchema,
} from "../shared/schema.ts";

export const AppDataSchema = Schema.Struct({
  currentSchoolYear: SchoolyearWithTimeGridSchema,
  tenant: TenantSchema,
  user: UserSchema,
  permissions: Schema.Array(Schema.String),
  settings: Schema.Array(Schema.String),
  holidays: Schema.Array(HolidaySchema),
});

export type AppData = Schema.Schema.Type<typeof AppDataSchema>;

export const AppPlatformApplicationMenuSchema = Schema.Struct({
  icon: Schema.String,
  id: Schema.Number,
  logoutUrl: Schema.NullOr(Schema.String),
  name: Schema.String,
  openInNewTab: Schema.Boolean,
  redirectUrl: Schema.String,
});

export const AppPlatformApplicationMenusSchema = Schema.Array(
  AppPlatformApplicationMenuSchema,
);

export type AppPlatformApplicationMenu = Schema.Schema.Type<
  typeof AppPlatformApplicationMenuSchema
>;
export type AppPlatformApplicationMenus = Schema.Schema.Type<
  typeof AppPlatformApplicationMenusSchema
>;

export const AppThirdPartyDataSchema = Schema.Struct({
  playgroundUrl: Schema.NullOr(Schema.String),
  sleekplanToken: Schema.String,
});

export type AppThirdPartyData = Schema.Schema.Type<
  typeof AppThirdPartyDataSchema
>;

export const DashboardCardsSchema = Schema.Struct({
  dashboardCards: Schema.Array(Schema.Unknown),
});

export type DashboardCards = Schema.Schema.Type<typeof DashboardCardsSchema>;

export const DashboardCardsDetailSchema = Schema.Struct({
  dashboardCardsDetails: Schema.Array(Schema.Unknown),
});

export type DashboardCardsDetail = Schema.Schema.Type<
  typeof DashboardCardsDetailSchema
>;

export const DashboardCardsStatusSchema = Schema.Struct({
  unreadCardsCount: Schema.Number,
});

export type DashboardCardsStatus = Schema.Schema.Type<
  typeof DashboardCardsStatusSchema
>;

export const TodayMetaSchema = Schema.Struct({
  greetingName: Schema.String,
  calendar: Schema.NullOr(Schema.Unknown),
});

export type TodayMeta = Schema.Schema.Type<typeof TodayMetaSchema>;

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

export type HomeCellType = Schema.Schema.Type<typeof HomeCellTypeSchema>;

export const HomeCellSchema = Schema.Struct({
  badge: Schema.NullOr(Schema.Unknown),
  type: HomeCellTypeSchema,
});

export const HomeSectionSchema = Schema.Struct({
  cells: Schema.Array(HomeCellSchema),
});

export const HomeSchema = Schema.Struct({
  schoolName: Schema.String,
  sections: Schema.Array(HomeSectionSchema),
  integrationsSection: Schema.Array(Schema.Unknown),
  isEmailUpdateRequired: Schema.Boolean,
});

export type Home = Schema.Schema.Type<typeof HomeSchema>;

export const MobileTenantSchema = Schema.Struct({
  id: Schema.String,
  displayName: Schema.String,
  wuVersion: Schema.String,
  language: Schema.String,
  schoolLoginName: Schema.String,
});

export const MobileTenantV1V2Schema = Schema.Struct({
  id: Schema.String,
  displayName: Schema.String,
  wuVersion: Schema.String,
  language: Schema.String,
});

export const MobilePermissionSchema = Schema.Literals([
  "READ_MESSAGES",
  "WRITE_OWN_ABSENCES",
  "WRITE_OWN_ABSENCE_REASON",
  "CLASS_REGISTER",
  "CHANGE_OWN_PASSWORD",
]);

export type MobilePermission = Schema.Schema.Type<
  typeof MobilePermissionSchema
>;

export const MobileUserSchema = Schema.Struct({
  id: Schema.Number,
  username: Schema.String,
  person: Schema.NullOr(Schema.Unknown),
  referencedStudents: Schema.Array(Schema.Unknown),
  locale: Schema.String,
  departmentId: Schema.Number,
  role: Schema.String,
  permissions: Schema.Array(MobilePermissionSchema),
});

export const MobileDataV1V2Schema = Schema.Struct({
  schoolYear: SchoolyearSchema,
  tenant: MobileTenantV1V2Schema,
  user: MobileUserSchema,
});

export const MobileDataSchema = Schema.Struct({
  schoolYear: SchoolyearSchema,
  tenant: MobileTenantSchema,
  user: MobileUserSchema,
});

export type MobileDataV1V2 = Schema.Schema.Type<typeof MobileDataV1V2Schema>;
export type MobileData = Schema.Schema.Type<typeof MobileDataSchema>;

export const StartupActionsSchema = Schema.Struct({
  startupActions: Schema.Array(
    Schema.Literals(["VERIFY_PROFILE_DATA", "FORCE_ADMIN_DETAIL_CHANGE"]),
  ),
});

export type StartupActions = Schema.Schema.Type<typeof StartupActionsSchema>;

export const OnboardingSchema = Schema.Struct({
  type: Schema.Literals(["TIMETABLE"]),
  time: Schema.String,
  step: Schema.String,
});

export type Onboarding = Schema.Schema.Type<typeof OnboardingSchema>;
export type OnboardingType = Onboarding["type"];
