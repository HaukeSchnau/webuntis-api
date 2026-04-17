import type {
  AppData,
  AppExamIntegrations,
  AppPlatformApplicationMenus,
  AppThirdPartyData,
  ClassregAbsencesMeta,
  ClassregHomeworkList,
  ClassregHomeworkMeta,
  ClassregLessonTopicsMeta,
  DashboardCards,
  DashboardCardsDetail,
  DashboardCardsStatus,
  ExamDetail,
  ExamFilter,
  ExamStatistics,
  Exams,
  Home,
  MessageComposeRecipients,
  MessageDetail,
  MessageDrafts,
  MessageRecipientFilter,
  MessageRecipientQuickfilters,
  MessageRecipientSearch,
  MessageReplyForm,
  MessageSent,
  MessagesInbox,
  MessagesPermissions,
  MessagesStatus,
  MobileData,
  MobileDataV1V2,
  Onboarding,
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
  TimetableSearch,
  TodayMeta,
  UserContactData,
  UserEmail,
} from "../../src/domains/schemas.ts";
import { ClientConfig } from "../../src/internal/config.ts";
import type { UnexpectedResponseError } from "../../src/internal/errors.ts";

export const readLiveConfig = () => ClientConfig.fromEnv();

export const liveEnvMissing = [
  process.env["WEBUNTIS_SCHOOL_NAME"] ? undefined : "WEBUNTIS_SCHOOL_NAME",
  process.env["WEBUNTIS_USERNAME"] ? undefined : "WEBUNTIS_USERNAME",
  process.env["WEBUNTIS_PASSWORD"] ? undefined : "WEBUNTIS_PASSWORD",
].filter((field): field is string => field !== undefined);

const redactString = (value: string) =>
  value
    .replace(/^\d{4}-\d{2}-\d{2}T[^"]*$/g, "<redacted-datetime>")
    .replace(/^\d{4}-\d{2}-\d{2}$/g, "<redacted-date>")
    .replace(/^\d{4}\.\d+\.\d+$/g, "<redacted-version>")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "<redacted-email>")
    .replace(/[A-Z][A-ZÄÖÜ-]{1,}/g, "<redacted-label>");

const normalizeUnknown = (value: unknown): unknown => {
  if (typeof value === "string") {
    return redactString(value);
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean" || value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(normalizeUnknown);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const normalizedKey = key.toLowerCase();
        if (
          [
            "requestid",
            "traceid",
            "authorization",
            "username",
            "greetingname",
          ].includes(normalizedKey) ||
          normalizedKey.includes("token")
        ) {
          return [key, "<redacted>"];
        }
        return [key, normalizeUnknown(entry)];
      }),
    );
  }
  return value;
};

export const normalizeAppData = (value: AppData) => normalizeUnknown(value);
export const normalizeAppPlatformApplicationMenus = (
  value: AppPlatformApplicationMenus,
) => normalizeUnknown(value);
export const normalizeAppExamIntegrations = (value: AppExamIntegrations) =>
  normalizeUnknown(value);
export const normalizeAppThirdPartyData = (value: AppThirdPartyData) =>
  normalizeUnknown(value);
export const normalizeClassregAbsencesMeta = (value: ClassregAbsencesMeta) =>
  normalizeUnknown(value);
export const normalizeClassregHomeworkList = (value: ClassregHomeworkList) =>
  normalizeUnknown(value);
export const normalizeClassregHomeworkMeta = (value: ClassregHomeworkMeta) =>
  normalizeUnknown(value);
export const normalizeClassregLessonTopicsMeta = (
  value: ClassregLessonTopicsMeta,
) => normalizeUnknown(value);
export const normalizeDashboardCards = (value: DashboardCards) =>
  normalizeUnknown(value);
export const normalizeDashboardCardsDetail = (value: DashboardCardsDetail) =>
  normalizeUnknown(value);
export const normalizeDashboardCardsStatus = (value: DashboardCardsStatus) =>
  normalizeUnknown(value);
export const normalizeExamDetail = (value: ExamDetail) =>
  normalizeUnknown(value);
export const normalizeExamFilter = (value: ExamFilter) =>
  normalizeUnknown(value);
export const normalizeExams = (value: Exams) => normalizeUnknown(value);
export const normalizeExamStatistics = (value: ExamStatistics) =>
  normalizeUnknown(value);
export const normalizeHome = (value: Home) => normalizeUnknown(value);
export const normalizeMessageComposeRecipients = (
  value: MessageComposeRecipients,
) => normalizeUnknown(value);
export const normalizeMessageDetail = (value: MessageDetail) =>
  normalizeUnknown(value);
export const normalizeMessageDrafts = (value: MessageDrafts) =>
  normalizeUnknown(value);
export const normalizeMessageRecipientFilter = (
  value: MessageRecipientFilter,
) => normalizeUnknown(value);
export const normalizeMessageRecipientQuickfilters = (
  value: MessageRecipientQuickfilters,
) => normalizeUnknown(value);
export const normalizeMessageReplyForm = (value: MessageReplyForm) =>
  normalizeUnknown(value);
export const normalizeMessageRecipientSearch = (
  value: MessageRecipientSearch,
) => normalizeUnknown(value);
export const normalizeMessageSent = (value: MessageSent) =>
  normalizeUnknown(value);
export const normalizeMessagesInbox = (value: MessagesInbox) =>
  normalizeUnknown(value);
export const normalizeMessagesPermissions = (value: MessagesPermissions) =>
  normalizeUnknown(value);
export const normalizeMessagesStatus = (value: MessagesStatus) =>
  normalizeUnknown(value);
export const normalizeMobileData = (value: MobileData | MobileDataV1V2) =>
  normalizeUnknown(value);
export const normalizeOnboarding = (value: Onboarding) =>
  normalizeUnknown(value);
export const normalizeUserContactData = (value: UserContactData) =>
  normalizeUnknown(value);
export const normalizeUserEmail = (value: UserEmail) => normalizeUnknown(value);
export const normalizeSessionStatus = (value: SessionStatus) =>
  normalizeUnknown(value);
export const normalizeStartupActions = (value: StartupActions) =>
  normalizeUnknown(value);
export const normalizeTimetableCalendar = (value: TimetableCalendar) =>
  normalizeUnknown(value);
export const normalizeTimetableAvailableRooms = (
  value: TimetableAvailableRooms,
) => normalizeUnknown(value);
export const normalizeTimetableEntriesWeekOverview = (
  value: TimetableEntriesWeekOverview,
) => normalizeUnknown(value);
export const normalizeTimetableExternalCalendar = (
  value: TimetableExternalCalendar,
) => normalizeUnknown(value);
export const normalizeTimeGrid = (value: TimeGrid) => normalizeUnknown(value);
export const normalizeTimetableGrid = (value: TimetableGrid) =>
  normalizeUnknown(value);
export const normalizeTimetableFilter = (value: TimetableFilter) =>
  normalizeUnknown(value);
export const normalizeTimetableEntriesSettings = (
  value: TimetableEntriesSettings,
) => normalizeUnknown(value);
export const normalizeTimetableEntries = (value: TimetableEntries) =>
  normalizeUnknown(value);
export const normalizeTimetableMenu = (value: TimetableMenu) =>
  normalizeUnknown(value);
export const normalizeTimetableSearch = (value: TimetableSearch) =>
  normalizeUnknown(value);
export const normalizeTodayMeta = (value: TodayMeta) => normalizeUnknown(value);

export const normalizeUnexpectedResponse = (error: UnexpectedResponseError) => {
  const rawBody = error.body ?? "";
  let body: unknown = rawBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = rawBody;
  }

  return {
    path: error.path.replace(/\/\d+(?=\/|$)/g, "/{id}"),
    status: error.status,
    body: normalizeUnknown(body),
  };
};
