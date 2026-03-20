import { Schema } from "effect";
import { TimeGridSchema, TimeRangeSchema } from "./shared.ts";

export const TimeGridTypeSchema = Schema.Literals([
  "CLOCK_HOURS",
  "LESSON_GRID",
]);

export type TimeGridType = Schema.Schema.Type<typeof TimeGridTypeSchema>;

export const TimetableFormatDefinitionSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  longname: Schema.String,
  showStartEndTimeOfSlots: Schema.Boolean,
  showStartEndTime: Schema.Boolean,
  showCancellations: Schema.Boolean,
  showExternalCalendars: Schema.Boolean,
  hideDetails: Schema.Boolean,
  minRows: Schema.Number,
  duration: TimeRangeSchema,
  timeGridType: TimeGridTypeSchema,
  timeGridDays: Schema.Array(Schema.String),
  timeGridSlots: Schema.Array(
    Schema.Struct({
      name: Schema.NullOr(Schema.String),
      number: Schema.NullOr(Schema.Number),
      duration: TimeRangeSchema,
    }),
  ),
});

export const TimetableGridSchema = Schema.Struct({
  firstDayOfWeek: Schema.String,
  studentFormat: Schema.Number,
  classFormat: Schema.Number,
  subjectFormat: Schema.Number,
  teacherFormat: Schema.Number,
  roomFormat: Schema.Number,
  resourceFormat: Schema.Number,
  formatDefinitions: Schema.Array(TimetableFormatDefinitionSchema),
});

export type TimetableGrid = Schema.Schema.Type<typeof TimetableGridSchema>;

export const TimetableResourceTypeSchema = Schema.Literals([
  "CLASS",
  "ROOM",
  "RESOURCE",
  "STUDENT",
  "SUBJECT",
  "TEACHER",
]);

export type TimetableResourceType = Schema.Schema.Type<
  typeof TimetableResourceTypeSchema
>;

export const TimetableSearchResultSchema = Schema.Struct({
  type: TimetableResourceTypeSchema,
  resource: Schema.Struct({
    id: Schema.Number,
    shortName: Schema.String,
    longName: Schema.String,
    displayName: Schema.String,
  }),
  imageUrl: Schema.NullOr(Schema.String),
});

export type TimetableSearchResult = Schema.Schema.Type<
  typeof TimetableSearchResultSchema
>;

export const TimetableMenuSchema = Schema.Struct({
  myTimetable: Schema.NullOr(TimetableSearchResultSchema),
  dependents: Schema.Array(TimetableSearchResultSchema),
  availableTimetables: Schema.Array(Schema.String),
});

export type TimetableMenu = Schema.Schema.Type<typeof TimetableMenuSchema>;

export const TimetableSearchSchema = Schema.Struct({
  numPartialMatches: Schema.Number,
  results: Schema.Array(TimetableSearchResultSchema),
});

export type TimetableSearch = Schema.Schema.Type<typeof TimetableSearchSchema>;
export type TimetableSearchResults = TimetableSearch;

export const TimetableAvailableRoomSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  longName: Schema.String,
  displayName: Schema.String,
});

export const TimetableAvailableRoomsSchema = Schema.Array(
  TimetableAvailableRoomSchema,
);

export type TimetableAvailableRoom = Schema.Schema.Type<
  typeof TimetableAvailableRoomSchema
>;
export type TimetableAvailableRooms = Schema.Schema.Type<
  typeof TimetableAvailableRoomsSchema
>;

export const DisplayResourceSchema = Schema.Struct({
  id: Schema.Number,
  shortName: Schema.String,
  longName: Schema.String,
  displayName: Schema.String,
});

export const TimetableDepartmentSchema = Schema.Struct({
  id: Schema.Number,
  shortName: Schema.String,
  longName: Schema.String,
  displayName: Schema.String,
});

export const TimetableClassFilterItemSchema = Schema.Struct({
  class: DisplayResourceSchema,
  classTeacher1: Schema.NullOr(DisplayResourceSchema),
  classTeacher2: Schema.NullOr(DisplayResourceSchema),
  department: TimetableDepartmentSchema,
});

export const TimetableTeacherFilterItemSchema = Schema.Struct({
  teacher: DisplayResourceSchema,
  departments: Schema.Array(TimetableDepartmentSchema),
  imageUrl: Schema.NullOr(Schema.String),
});

export const TimetableSubjectFilterItemSchema = Schema.Struct({
  subject: DisplayResourceSchema,
  departments: Schema.Array(TimetableDepartmentSchema),
});

export const TimetableRoomFilterItemSchema = Schema.Struct({
  room: DisplayResourceSchema,
  capacity: Schema.Number,
  roomGroups: Schema.Array(Schema.Unknown),
  building: Schema.NullOr(DisplayResourceSchema),
  department: Schema.NullOr(TimetableDepartmentSchema),
});

export const TimetableFilterSchema = Schema.Struct({
  resourceType: TimetableResourceTypeSchema,
  preSelected: Schema.NullOr(Schema.Unknown),
  buildings: Schema.Array(Schema.Unknown),
  departments: Schema.Array(TimetableDepartmentSchema),
  roomGroups: Schema.Array(Schema.Unknown),
  resourceTypes: Schema.Array(Schema.Unknown),
  assignmentGroups: Schema.Array(Schema.Unknown),
  classes: Schema.Array(TimetableClassFilterItemSchema),
  resources: Schema.Array(Schema.Unknown),
  rooms: Schema.Array(TimetableRoomFilterItemSchema),
  subjects: Schema.Array(TimetableSubjectFilterItemSchema),
  students: Schema.Array(Schema.Unknown),
  teachers: Schema.Array(TimetableTeacherFilterItemSchema),
});

export type TimetableFilter = Schema.Schema.Type<typeof TimetableFilterSchema>;

export const TimetableEntriesSettingsSchema = Schema.Struct({
  showSymbols: Schema.Boolean,
  showTeacherAbsences: Schema.Boolean,
  showStudentAbsences: Schema.Boolean,
  showRoomLocks: Schema.Boolean,
  showResourceLocks: Schema.Boolean,
  showForeignSubstitutions: Schema.Boolean,
  showICal: Schema.Boolean,
  showICalExport: Schema.Boolean,
  showAllDropdownElements: Schema.Boolean,
  highlightChanges: Schema.Boolean,
  highlightExams: Schema.Boolean,
  highlightCancellations: Schema.Boolean,
  highlightExternalEntries: Schema.Boolean,
});

export type TimetableEntriesSettings = Schema.Schema.Type<
  typeof TimetableEntriesSettingsSchema
>;

export const DayDataStatusSchema = Schema.Literals([
  "REGULAR",
  "NO_DATA",
  "NOT_ALLOWED",
  "NOT_ALLOWED_FOR_RESOURCE",
]);

export type DayDataStatus = Schema.Schema.Type<typeof DayDataStatusSchema>;

export const TimetableEntryDaySchema = Schema.Struct({
  date: Schema.String,
  resourceType: TimetableResourceTypeSchema,
  resource: Schema.Struct({
    id: Schema.Number,
    shortName: Schema.String,
    longName: Schema.String,
    displayName: Schema.String,
  }),
  status: Schema.String,
  dayEntries: Schema.Array(Schema.Unknown),
  gridEntries: Schema.Array(Schema.Unknown),
  backEntries: Schema.Array(Schema.Unknown),
});

export const TimetableEntriesSchema = Schema.Struct({
  format: Schema.Number,
  days: Schema.Array(TimetableEntryDaySchema),
  errors: Schema.Array(Schema.Unknown),
});

export type TimetableEntries = Schema.Schema.Type<
  typeof TimetableEntriesSchema
>;

export const TimetableCalendarSchema = Schema.Struct({
  integrations: Schema.Array(Schema.Unknown),
});

export type TimetableCalendar = Schema.Schema.Type<
  typeof TimetableCalendarSchema
>;

export const TimetableWeekOverviewCellSchema = Schema.Struct({
  backEntries: Schema.Array(Schema.Unknown),
  gridEntries: Schema.Array(Schema.Unknown),
});

export const TimetableWeekOverviewDayResourceSchema = Schema.Struct({
  resource: DisplayResourceSchema,
  status: DayDataStatusSchema,
  cells: Schema.Array(TimetableWeekOverviewCellSchema),
});

export const TimetableWeekOverviewDaySchema = Schema.Struct({
  day: Schema.String,
  resources: Schema.Array(TimetableWeekOverviewDayResourceSchema),
});

export const TimetableWeekOverviewSlotSchema = Schema.Struct({
  name: Schema.String,
  number: Schema.Number,
  duration: TimeRangeSchema,
});

export const TimetableEntriesWeekOverviewSchema = Schema.Struct({
  slots: Schema.Array(TimetableWeekOverviewSlotSchema),
  days: Schema.Array(TimetableWeekOverviewDaySchema),
});

export type TimetableEntriesWeekOverview = Schema.Schema.Type<
  typeof TimetableEntriesWeekOverviewSchema
>;

export const TimetableExternalCalendarSchema = Schema.Array(Schema.Unknown);

export type TimetableExternalCalendar = Schema.Schema.Type<
  typeof TimetableExternalCalendarSchema
>;

export { TimeGridSchema };
