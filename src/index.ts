import { ClientConfig } from "./internal/config.ts";

export { AuthClient } from "./auth.ts";
export {
  layer,
  makeWebUntisLayer,
  WebUntisClient,
} from "./client.ts";
export type { OnboardingRequest } from "./domains/app/index.ts";
export { AppClient } from "./domains/app/index.ts";
export type { ClassregHomeworkListRequest } from "./domains/classreg/index.ts";
export { ClassregClient } from "./domains/classreg/index.ts";
export type { ExamDetailRequest } from "./domains/exams/index.ts";
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
export { ClientConfig } from "./internal/config.ts";
export {
  AuthError,
  ConfigurationError,
  DecodeError,
  DiscoveryError,
  TransportError,
} from "./internal/errors.ts";
export const clientConfigFromEnv = ClientConfig.fromEnv;
