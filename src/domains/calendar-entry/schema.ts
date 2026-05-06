import { Schema } from "effect";

export const CalendarEntryTodayStatusSchema = Schema.Literals([
  "TAKING_PLACE",
  "CANCELLED",
  "SUBSTITUTION",
  "MAYBE",
  "MOVED",
  "MOVED_AWAY",
  "MOVED_HERE",
]);

export const CalendarEntryTodayTypeSchema = Schema.Literals([
  "MEETING",
  "STAND_BY_PERIOD",
  "OFFICE_HOUR",
  "BREAK_SUPERVISION",
  "NORMAL_TEACHING_PERIOD",
  "ADDITIONAL_PERIOD",
  "EXAM",
  "EVENT",
  "CUSTOM",
]);

export const CalendarEntryTodayParticipantStatusSchema = Schema.Literals([
  "REGULAR",
  "REMOVED",
  "SUBSTITUTION",
]);

export const CalendarEntryTodayResourceSchema = Schema.Struct({
  displayName: Schema.String,
  hasTimetable: Schema.Boolean,
  id: Schema.Number,
  longName: Schema.String,
  shortName: Schema.String,
});

export const CalendarEntryTodayLessonSchema = Schema.Struct({
  lessonId: Schema.Number,
  lessonNumber: Schema.Number,
});

export const CalendarEntryTodaySubTypeSchema = Schema.Struct({
  displayInPeriodDetails: Schema.Boolean,
  displayName: Schema.String,
  id: Schema.Number,
});

export const CalendarEntryTodayRoomSchema = Schema.Struct({
  displayName: Schema.String,
  hasTimetable: Schema.Boolean,
  id: Schema.Number,
  longName: Schema.String,
  shortName: Schema.String,
  status: CalendarEntryTodayParticipantStatusSchema,
});

export const CalendarEntryTodayTeacherSchema = Schema.Struct({
  displayName: Schema.String,
  hasTimetable: Schema.Boolean,
  id: Schema.Number,
  imageUrl: Schema.NullOr(Schema.String),
  longName: Schema.String,
  shortName: Schema.String,
  status: CalendarEntryTodayParticipantStatusSchema,
});

export const CalendarEntryTodayEntrySchema = Schema.Struct({
  absenceReasonId: Schema.NullOr(Schema.Number),
  color: Schema.NullOr(Schema.String),
  endDateTime: Schema.String,
  exam: Schema.NullOr(Schema.Unknown),
  id: Schema.Number,
  klasses: Schema.Array(CalendarEntryTodayResourceSchema),
  lesson: CalendarEntryTodayLessonSchema,
  originalCalendarEntry: Schema.NullOr(Schema.Unknown),
  rooms: Schema.Array(CalendarEntryTodayRoomSchema),
  startDateTime: Schema.String,
  status: CalendarEntryTodayStatusSchema,
  subType: CalendarEntryTodaySubTypeSchema,
  subject: CalendarEntryTodayResourceSchema,
  teachers: Schema.Array(CalendarEntryTodayTeacherSchema),
  type: CalendarEntryTodayTypeSchema,
});

export const CalendarEntryTodayEntriesSchema = Schema.Array(CalendarEntryTodayEntrySchema);

export type CalendarEntryTodayEntry = Schema.Schema.Type<typeof CalendarEntryTodayEntrySchema>;
export type CalendarEntryTodayEntries = Schema.Schema.Type<typeof CalendarEntryTodayEntriesSchema>;
