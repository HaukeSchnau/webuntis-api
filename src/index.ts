import { ClientConfig } from "./internal/config.ts";

export { AuthClient } from "./auth.ts";
export { makeWebUntisLayer, WebUntisClient } from "./client.ts";
export type { WebUntisClientShape } from "./client.ts";
export type { OnboardingRequest } from "./domains/app/index.ts";
export { AppClient } from "./domains/app/index.ts";
export type { ClassregHomeworkListRequest } from "./domains/classreg/index.ts";
export { ClassregClient } from "./domains/classreg/index.ts";
export type {
  ExamDateRangeRequest,
  ExamDetailRequest,
  ExamsListRequest,
} from "./domains/exams/index.ts";
export { ExamsClient } from "./domains/exams/index.ts";
export type {
  MessageComposeRecipientsRequest,
  MessageDetailRequest,
  MessageRecipientFilterRequest,
  MessageRecipientSearchRequest,
  MessageReplyFormRequest,
} from "./domains/messages/index.ts";
export { MessagesClient } from "./domains/messages/index.ts";
export { ProfileClient } from "./domains/profile/index.ts";
export { SchoolyearsClient } from "./domains/schoolyears/index.ts";
export type { SessionStatusRequest } from "./domains/session/index.ts";
export { SessionClient } from "./domains/session/index.ts";
export type {
  TimetableAvailableRoomsRequest,
  TimetableCalendarRequest,
  TimetableEntriesRequest,
  TimetableEntriesSettingsRequest,
  TimetableEntriesWeekOverviewRequest,
  TimetableExternalCalendarRequest,
  TimetableFilterRequest,
  TimetableGridRequest,
  TimetableSearchRequest,
} from "./domains/timetable/index.ts";
export { TimetableClient } from "./domains/timetable/index.ts";
export type {
  AppData,
  AppExamIntegrations,
  AppPlatformApplicationMenus,
  AppThirdPartyData,
  ClassregAbsencesMeta,
  ClassregHomeworkDateRangeType,
  ClassregHomeworkList,
  ClassregHomeworkMeta,
  ClassregLessonTopicsMeta,
  DashboardCards,
  DashboardCardsDetail,
  DashboardCardsStatus,
  ExamDetail,
  ExamFilter,
  Exams,
  ExamsForClass,
  ExamStatistics,
  Home,
  MessageComposeRecipients,
  MessageDetail,
  MessageDrafts,
  MessageRecipientFilter,
  MessageRecipientOption,
  MessageRecipientQuickfilters,
  MessageRecipientSearch,
  MessageReplyForm,
  MessageSent,
  MessagesInbox,
  MessagesPermissions,
  MessagesStatus,
  MobileData,
  Onboarding,
  Schoolyear,
  SessionStatus,
  StartupActions,
  TimeGrid,
  TimetableAvailableRooms,
  TimetableCalendar,
  TimetableEntries,
  TimetableEntriesSettings,
  TimetableEntriesWeekOverview,
  TimetableExternalCalendar,
  TimetableFilter,
  TimetableGrid,
  TimetableMenu,
  TimetableResourceType,
  TimetableSearch,
  TodayMeta,
  UserContactData,
  UserEmail,
} from "./domains/schemas.ts";
export { ClientConfig } from "./internal/config.ts";
export type { LiveEnvInput } from "./internal/config.ts";
export { withSchoolYear } from "./internal/school-year-context.ts";
export type { SchoolYearScope } from "./internal/school-year-context.ts";
export {
  AuthError,
  ConfigurationError,
  DecodeError,
  DiscoveryError,
  InvalidRequestError,
  TransportError,
} from "./internal/errors.ts";
export type { WebUntisError } from "./internal/errors.ts";
export type { RequestFailure } from "./internal/http.ts";
export type { WebUntisClientConfig } from "./internal/types.ts";
export const clientConfigFromEnv = ClientConfig.fromEnv;
