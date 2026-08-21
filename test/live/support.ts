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
import type { MobileDataV1V2 } from "../../src/domains/app/schema.ts";
import { TransportError } from "../../src/internal/errors.ts";

const isBlank = (value: string | undefined) => value === undefined || value === "";

export const liveEnvMissing = [
  "WEBUNTIS_SCHOOL_NAME",
  "WEBUNTIS_USERNAME",
  "WEBUNTIS_PASSWORD",
].filter((name) => isBlank(process.env[name]));

const stableVocabularyKeys = new Set([
  "errorcode",
  "recipientoptions",
  "resourcetype",
  "resourcetypes",
  "role",
  "roles",
  "type",
  "views",
]);

function normalizeString(value: string, parentKey?: string): string {
  if (/^\d{4}-\d{2}-\d{2}T[^"]*$/u.test(value)) {
    return "<dynamic-datetime>";
  }
  if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return "<dynamic-date>";
  }
  if (/^\d{4}\.\d+\.\d+$/u.test(value)) {
    return "<dynamic-version>";
  }
  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/iu.test(value)) {
    return "<personal-email>";
  }
  if (parentKey !== undefined && stableVocabularyKeys.has(parentKey)) {
    return value;
  }
  return value.replace(/[A-Z][A-ZÄÖÜ-]{1,}/gu, "<personal-label>");
}

export function normalizeSnapshotValue(value: unknown, parentKey?: string): unknown {
  if (typeof value === "string") {
    return normalizeString(value, parentKey);
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean" || value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeSnapshotValue(entry, parentKey));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const normalizedKey = key.toLowerCase();
        if (["requestid", "traceid"].includes(normalizedKey)) {
          return [key, "<dynamic-id>"];
        }
        if (normalizedKey === "username") {
          return [key, "<personal-username>"];
        }
        if (normalizedKey === "greetingname") {
          return [key, "<personal-name>"];
        }
        if (normalizedKey === "authorization" || normalizedKey.includes("token")) {
          return [key, "<secret>"];
        }
        return [key, normalizeSnapshotValue(entry, normalizedKey)];
      }),
    );
  }
  return value;
}

export function summarizeSnapshotCollection<T>(
  items: ReadonlyArray<T>,
  representativeItemLimit = 5,
) {
  return {
    itemCount: "<dynamic-count>",
    items: items.slice(0, representativeItemLimit),
    summary: "<representative-items>",
  } as const;
}

const normalizeUnknown = normalizeSnapshotValue;
function normalizeCollection<T>(items: ReadonlyArray<T>): unknown {
  return normalizeUnknown(summarizeSnapshotCollection(items));
}

export const normalizeAppData = (value: AppData) => normalizeUnknown(value);
export const normalizeAppPlatformApplicationMenus = (value: AppPlatformApplicationMenus) =>
  normalizeUnknown(value);
export const normalizeAppExamIntegrations = (value: AppExamIntegrations) => normalizeUnknown(value);
export const normalizeAppThirdPartyData = (value: AppThirdPartyData) => normalizeUnknown(value);
export const normalizeClassregAbsencesMeta = (value: ClassregAbsencesMeta) =>
  normalizeUnknown(value);
export const normalizeClassregHomeworkList = (value: ClassregHomeworkList) =>
  normalizeUnknown({ ...value, homeworkList: normalizeCollection(value.homeworkList) });
export const normalizeClassregHomeworkMeta = (value: ClassregHomeworkMeta) =>
  normalizeUnknown({
    ...value,
    classes: normalizeCollection(value.classes),
    schoolYears: normalizeCollection(value.schoolYears),
    subjects: normalizeCollection(value.subjects),
    teachers: normalizeCollection(value.teachers),
  });
export const normalizeClassregLessonTopicsMeta = (value: ClassregLessonTopicsMeta) =>
  normalizeUnknown(value);
export const normalizeDashboardCards = (value: DashboardCards) => normalizeUnknown(value);
export const normalizeDashboardCardsDetail = (value: DashboardCardsDetail) =>
  normalizeUnknown(value);
export const normalizeDashboardCardsStatus = (value: DashboardCardsStatus) =>
  normalizeUnknown(value);
export const normalizeExamDetail = (value: ExamDetail) => normalizeUnknown(value);
export const normalizeExamFilter = (value: ExamFilter) =>
  normalizeUnknown({
    classes: normalizeCollection(value.classes),
    examTypes: normalizeCollection(value.examTypes),
    subjects: normalizeCollection(value.subjects),
    teachers: normalizeCollection(value.teachers),
  });
export const normalizeExams = (value: Exams) => normalizeUnknown(value);
export const normalizeExamStatistics = (value: ExamStatistics) => normalizeUnknown(value);
export const normalizeHome = (value: Home) => normalizeUnknown(value);
export const normalizeMessageComposeRecipients = (value: MessageComposeRecipients) =>
  normalizeUnknown(value);
export const normalizeMessageDetail = (value: MessageDetail) => normalizeUnknown(value);
export const normalizeMessageDrafts = (value: MessageDrafts) => normalizeUnknown(value);
export const normalizeMessageRecipientFilter = (value: MessageRecipientFilter) =>
  normalizeUnknown(value);
export const normalizeMessageRecipientQuickfilters = (value: MessageRecipientQuickfilters) => ({
  ...value,
  items: value.items.map((item) => normalizeUnknown({ ...item, personCount: "<dynamic-count>" })),
});
export const normalizeMessageReplyForm = (value: MessageReplyForm) => normalizeUnknown(value);
export const normalizeMessageRecipientSearch = (value: MessageRecipientSearch) =>
  normalizeUnknown(value);
export const normalizeMessageSent = (value: MessageSent) => normalizeUnknown(value);
export const normalizeMessagesInbox = (value: MessagesInbox) => normalizeUnknown(value);
export const normalizeMessagesPermissions = (value: MessagesPermissions) => normalizeUnknown(value);
export const normalizeMessagesStatus = (value: MessagesStatus) => normalizeUnknown(value);
export const normalizeMobileData = (value: MobileData | MobileDataV1V2) => normalizeUnknown(value);
export const normalizeOnboarding = (value: Onboarding) => normalizeUnknown(value);
export const normalizeUserContactData = (value: UserContactData) => normalizeUnknown(value);
export const normalizeUserEmail = (value: UserEmail) => normalizeUnknown(value);
export const normalizeSessionStatus = (value: SessionStatus) => normalizeUnknown(value);
export const normalizeStartupActions = (value: StartupActions) => normalizeUnknown(value);
export const normalizeTimetableCalendar = (value: TimetableCalendar) => normalizeUnknown(value);
export const normalizeTimetableAvailableRooms = (value: TimetableAvailableRooms) =>
  normalizeUnknown(value);
export const normalizeTimetableEntriesWeekOverview = (value: TimetableEntriesWeekOverview) =>
  normalizeUnknown(value);
export const normalizeTimetableExternalCalendar = (value: TimetableExternalCalendar) =>
  normalizeUnknown(value);
export const normalizeTimeGrid = (value: TimeGrid) => normalizeUnknown(value);
export const normalizeTimetableGrid = (value: TimetableGrid) => normalizeUnknown(value);
export const normalizeTimetableFilter = (value: TimetableFilter) => normalizeUnknown(value);
export const normalizeTimetableEntriesSettings = (value: TimetableEntriesSettings) =>
  normalizeUnknown(value);
export const normalizeTimetableEntries = (value: TimetableEntries) => normalizeUnknown(value);
export const normalizeTimetableMenu = (value: TimetableMenu) => normalizeUnknown(value);
export const normalizeTimetableSearch = (value: TimetableSearch) => normalizeUnknown(value);
export const normalizeTodayMeta = (value: TodayMeta) => normalizeUnknown(value);

export const normalizeTransportError = (error: unknown) => {
  if (!(error instanceof TransportError)) {
    throw new TypeError(`expected a TransportError, got ${String(error)}`);
  }

  const rawBody = error.body ?? "";
  let body: unknown = rawBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = rawBody;
  }

  return {
    path: error.path.replace(/\/\d+(?=\/|$)/gu, "/{id}"),
    status: error.status,
    body: normalizeUnknown(body),
  };
};
