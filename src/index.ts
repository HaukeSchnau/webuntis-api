import { ClientConfig } from "./internal/config.ts";

export { AuthClient } from "./auth.ts";
export {
  layer,
  makeWebUntisLayer,
  WebUntisClient,
} from "./client.ts";
export type { OnboardingRequest } from "./domains/app/index.ts";
export { AppClient } from "./domains/app/index.ts";
export { ClassregClient } from "./domains/classreg/index.ts";
export { ExamsClient } from "./domains/exams/index.ts";
export { MessagesClient } from "./domains/messages/index.ts";
export { ProfileClient } from "./domains/profile/index.ts";
export * from "./domains/schemas.ts";
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
  TimetableSearchRequest,
} from "./domains/timetable/index.ts";
export { TimetableClient } from "./domains/timetable/index.ts";
export { ClientConfig } from "./internal/config.ts";
export const clientConfigFromEnv = ClientConfig.fromEnv;
