export { AuthClient } from "./auth.ts";
export { webUntisLayer, WebUntisClient } from "./client.ts";
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
  TimetableEntriesForResource,
  TimetableEntriesForResourcesOptions,
  TimetableEntriesForResourcesRequest,
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
export type * from "./domains/schemas.ts";
export { Credential, WebUntisConnection } from "./internal/connection.ts";
export type { SchoolTarget } from "./internal/connection.ts";
export { searchSchools } from "./internal/discovery.ts";
export { withSchoolYear } from "./internal/school-year-context.ts";
export type { SchoolYearScope } from "./internal/school-year-context.ts";
export {
  AuthError,
  ConfigurationError,
  DecodeError,
  DiscoveryError,
  InvalidCredentials,
  InvalidRequestError,
  PermissionDenied,
  RateLimited,
  TransportError,
  UpstreamRejected,
} from "./internal/errors.ts";
export type { LoginError, WebUntisError } from "./internal/errors.ts";
export type { ConnectionLimits } from "./internal/transport.ts";
