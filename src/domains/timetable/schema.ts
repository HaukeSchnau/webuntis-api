import { Schema } from "effect";
import { EntityId } from "../../internal/schema.ts";
import { DisplayResourceSchema, JsonObjectSchema, TimeRangeSchema } from "../shared/schema.ts";

export const TimeGridTypeSchema = Schema.Literals(["CLOCK_HOURS", "LESSON_GRID"]);

export type TimeGridType = Schema.Schema.Type<typeof TimeGridTypeSchema>;

export const TimetableFormatDefinitionSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  longname: Schema.String,
  showStartEndTimeOfSlots: Schema.Boolean,
  showStartEndTime: Schema.Boolean,
  showCancellations: Schema.Boolean,
  showExternalCalendars: Schema.Boolean,
  hideDetails: Schema.Boolean,
  minRows: Schema.Int,
  duration: TimeRangeSchema,
  timeGridType: TimeGridTypeSchema,
  timeGridDays: Schema.Array(Schema.String),
  timeGridSlots: Schema.Array(
    Schema.Struct({
      name: Schema.NullOr(Schema.String),
      number: Schema.NullOr(Schema.Int),
      duration: TimeRangeSchema,
    }),
  ),
});

export type TimetableFormatDefinition = Schema.Schema.Type<typeof TimetableFormatDefinitionSchema>;

export const TimetableGridSchema = Schema.Struct({
  firstDayOfWeek: Schema.String,
  studentFormat: Schema.Int,
  classFormat: Schema.Int,
  subjectFormat: Schema.Int,
  teacherFormat: Schema.Int,
  roomFormat: Schema.Int,
  resourceFormat: Schema.Int,
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

export type TimetableResourceType = Schema.Schema.Type<typeof TimetableResourceTypeSchema>;

export const TimetableSearchResultSchema = Schema.Struct({
  type: TimetableResourceTypeSchema,
  resource: DisplayResourceSchema,
  imageUrl: Schema.NullOr(Schema.String),
});

export type TimetableSearchResult = Schema.Schema.Type<typeof TimetableSearchResultSchema>;

export const TimetableMenuSchema = Schema.Struct({
  myTimetable: Schema.NullOr(TimetableSearchResultSchema),
  dependents: Schema.Array(TimetableSearchResultSchema),
  availableTimetables: Schema.Array(Schema.String),
});

export type TimetableMenu = Schema.Schema.Type<typeof TimetableMenuSchema>;

export const TimetableSearchSchema = Schema.Struct({
  numPartialMatches: Schema.Int,
  results: Schema.Array(TimetableSearchResultSchema),
});

export type TimetableSearch = Schema.Schema.Type<typeof TimetableSearchSchema>;

export const TimetableAvailableRoomSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  longName: Schema.String,
  displayName: Schema.String,
});

export const TimetableAvailableRoomsSchema = Schema.Array(TimetableAvailableRoomSchema);

export type TimetableAvailableRoom = Schema.Schema.Type<typeof TimetableAvailableRoomSchema>;
export type TimetableAvailableRooms = Schema.Schema.Type<typeof TimetableAvailableRoomsSchema>;

export const TimetableDepartmentSchema = DisplayResourceSchema;

export type TimetableDepartment = Schema.Schema.Type<typeof TimetableDepartmentSchema>;

export const TimetableClassFilterItemSchema = Schema.Struct({
  class: DisplayResourceSchema,
  classTeacher1: Schema.NullOr(DisplayResourceSchema),
  classTeacher2: Schema.NullOr(DisplayResourceSchema),
  department: TimetableDepartmentSchema,
});

export type TimetableClassFilterItem = Schema.Schema.Type<typeof TimetableClassFilterItemSchema>;

export const TimetableTeacherFilterItemSchema = Schema.Struct({
  teacher: DisplayResourceSchema,
  departments: Schema.Array(TimetableDepartmentSchema),
  imageUrl: Schema.NullOr(Schema.String),
});

export type TimetableTeacherFilterItem = Schema.Schema.Type<
  typeof TimetableTeacherFilterItemSchema
>;

export const TimetableSubjectFilterItemSchema = Schema.Struct({
  subject: DisplayResourceSchema,
  departments: Schema.Array(TimetableDepartmentSchema),
});

export type TimetableSubjectFilterItem = Schema.Schema.Type<
  typeof TimetableSubjectFilterItemSchema
>;

export const TimetableRoomFilterItemSchema = Schema.Struct({
  room: DisplayResourceSchema,
  capacity: Schema.Int,
  roomGroups: Schema.Array(JsonObjectSchema),
  building: Schema.NullOr(DisplayResourceSchema),
  department: Schema.NullOr(TimetableDepartmentSchema),
});

export type TimetableRoomFilterItem = Schema.Schema.Type<typeof TimetableRoomFilterItemSchema>;

export const TimetableFilterSelectionSchema = JsonObjectSchema;

export type TimetableFilterSelection = Schema.Schema.Type<typeof TimetableFilterSelectionSchema>;
export const TimetableFilterResourceGroupSchema = JsonObjectSchema;

export type TimetableFilterResourceGroup = Schema.Schema.Type<
  typeof TimetableFilterResourceGroupSchema
>;
export const TimetableFilterSchema = Schema.Struct({
  resourceType: TimetableResourceTypeSchema,
  preSelected: Schema.NullOr(TimetableFilterSelectionSchema),
  buildings: Schema.Array(JsonObjectSchema),
  departments: Schema.Array(TimetableDepartmentSchema),
  roomGroups: Schema.Array(TimetableFilterResourceGroupSchema),
  resourceTypes: Schema.Array(JsonObjectSchema),
  assignmentGroups: Schema.Array(JsonObjectSchema),
  classes: Schema.Array(TimetableClassFilterItemSchema),
  resources: Schema.Array(JsonObjectSchema),
  rooms: Schema.Array(TimetableRoomFilterItemSchema),
  subjects: Schema.Array(TimetableSubjectFilterItemSchema),
  students: Schema.Array(JsonObjectSchema),
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

export type TimetableEntriesSettings = Schema.Schema.Type<typeof TimetableEntriesSettingsSchema>;

export const DayDataStatusSchema = Schema.Literals([
  "REGULAR",
  "NO_DATA",
  "NOT_ALLOWED",
  "NOT_ALLOWED_FOR_RESOURCE",
]);

export type DayDataStatus = Schema.Schema.Type<typeof DayDataStatusSchema>;

const TimetableEntryRestSchema = Schema.Record(Schema.String, Schema.Json);

export const TimetableEntryPositionResourceSchema = Schema.StructWithRest(
  Schema.Struct({
    type: Schema.String,
    status: Schema.String,
    shortName: Schema.String,
    longName: Schema.String,
    displayName: Schema.String,
    displayNameLabel: Schema.NullOr(Schema.String),
  }),
  [TimetableEntryRestSchema],
);

export type TimetableEntryPositionResource = Schema.Schema.Type<
  typeof TimetableEntryPositionResourceSchema
>;

export const TimetableEntryPositionSchema = Schema.StructWithRest(
  Schema.Struct({
    current: Schema.NullOr(TimetableEntryPositionResourceSchema),
    removed: Schema.NullOr(TimetableEntryPositionResourceSchema),
  }),
  [TimetableEntryRestSchema],
);

export type TimetableEntryPosition = Schema.Schema.Type<typeof TimetableEntryPositionSchema>;

export const TimetableEntryTextSchema = Schema.StructWithRest(
  Schema.Struct({
    type: Schema.String,
    text: Schema.String,
  }),
  [TimetableEntryRestSchema],
);

export type TimetableEntryText = Schema.Schema.Type<typeof TimetableEntryTextSchema>;

const TimetableEntryPositionsSchema = Schema.NullOr(Schema.Array(TimetableEntryPositionSchema));

export const TimetableEntrySchema = Schema.StructWithRest(
  Schema.Struct({
    ids: Schema.Array(EntityId),
    duration: TimeRangeSchema,
    type: Schema.String,
    status: Schema.String,
    layoutStartPosition: Schema.Int,
    layoutWidth: Schema.Int,
    layoutGroup: Schema.Int,
    color: Schema.String,
    notesAll: Schema.String,
    icons: Schema.Array(Schema.String),
    position1: Schema.Array(TimetableEntryPositionSchema),
    position2: TimetableEntryPositionsSchema,
    position3: TimetableEntryPositionsSchema,
    position4: TimetableEntryPositionsSchema,
    texts: Schema.Array(TimetableEntryTextSchema),
    lessonText: Schema.String,
    lessonInfo: Schema.NullOr(Schema.String),
    substitutionText: Schema.String,
  }),
  [TimetableEntryRestSchema],
);

export type TimetableEntry = Schema.Schema.Type<typeof TimetableEntrySchema>;
export const TimetableEntriesErrorSchema = JsonObjectSchema;

export type TimetableEntriesError = Schema.Schema.Type<typeof TimetableEntriesErrorSchema>;
export const TimetableEntryDaySchema = Schema.Struct({
  date: Schema.String,
  resourceType: TimetableResourceTypeSchema,
  resource: DisplayResourceSchema,
  status: DayDataStatusSchema,
  dayEntries: Schema.Array(TimetableEntrySchema),
  gridEntries: Schema.Array(TimetableEntrySchema),
  backEntries: Schema.Array(TimetableEntrySchema),
});

export type TimetableEntryDay = Schema.Schema.Type<typeof TimetableEntryDaySchema>;

export const TimetableEntriesSchema = Schema.Struct({
  format: Schema.Int,
  days: Schema.Array(TimetableEntryDaySchema),
  errors: Schema.Array(TimetableEntriesErrorSchema),
});

export type TimetableEntries = Schema.Schema.Type<typeof TimetableEntriesSchema>;

export const TimetableCalendarSchema = Schema.Struct({
  integrations: Schema.Array(JsonObjectSchema),
});

export type TimetableCalendar = Schema.Schema.Type<typeof TimetableCalendarSchema>;

export const TimetableWeekOverviewCellSchema = Schema.Struct({
  backEntries: Schema.Array(TimetableEntrySchema),
  gridEntries: Schema.Array(TimetableEntrySchema),
});

export type TimetableWeekOverviewCell = Schema.Schema.Type<typeof TimetableWeekOverviewCellSchema>;

export const TimetableWeekOverviewDayResourceSchema = Schema.Struct({
  resource: DisplayResourceSchema,
  status: DayDataStatusSchema,
  cells: Schema.Array(TimetableWeekOverviewCellSchema),
});

export type TimetableWeekOverviewDayResource = Schema.Schema.Type<
  typeof TimetableWeekOverviewDayResourceSchema
>;

export const TimetableWeekOverviewDaySchema = Schema.Struct({
  day: Schema.String,
  resources: Schema.Array(TimetableWeekOverviewDayResourceSchema),
});

export type TimetableWeekOverviewDay = Schema.Schema.Type<typeof TimetableWeekOverviewDaySchema>;

export const TimetableWeekOverviewSlotSchema = Schema.Struct({
  name: Schema.String,
  number: Schema.Int,
  duration: TimeRangeSchema,
});

export type TimetableWeekOverviewSlot = Schema.Schema.Type<typeof TimetableWeekOverviewSlotSchema>;

export const TimetableEntriesWeekOverviewSchema = Schema.Struct({
  slots: Schema.Array(TimetableWeekOverviewSlotSchema),
  days: Schema.Array(TimetableWeekOverviewDaySchema),
});

export type TimetableEntriesWeekOverview = Schema.Schema.Type<
  typeof TimetableEntriesWeekOverviewSchema
>;

export const TimetableExternalCalendarItemSchema = JsonObjectSchema;

export type TimetableExternalCalendarItem = Schema.Schema.Type<
  typeof TimetableExternalCalendarItemSchema
>;
export const TimetableExternalCalendarSchema = Schema.Array(TimetableExternalCalendarItemSchema);

export type TimetableExternalCalendar = Schema.Schema.Type<typeof TimetableExternalCalendarSchema>;
