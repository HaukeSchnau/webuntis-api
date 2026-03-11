import { Schema } from "effect";

export const DateRangeSchema = Schema.Struct({
  start: Schema.String,
  end: Schema.String
});

export const TimeRangeSchema = Schema.Struct({
  start: Schema.String,
  end: Schema.String
});

export const TimeGridUnitSchema = Schema.Struct({
  unitOfDay: Schema.Number,
  startTime: Schema.Number,
  endTime: Schema.Number
});

export const TimeGridSchema = Schema.Struct({
  schoolyearId: Schema.Number,
  units: Schema.Array(TimeGridUnitSchema)
});

export const SchoolyearSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  dateRange: DateRangeSchema
});

export type Schoolyear = Schema.Schema.Type<typeof SchoolyearSchema>;

export const SchoolyearWithTimeGridSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  dateRange: DateRangeSchema,
  timeGrid: TimeGridSchema
});

export const TenantSchema = Schema.Struct({
  displayName: Schema.String,
  id: Schema.String,
  name: Schema.String
});

export const UserSchema = Schema.Struct({
  id: Schema.Number,
  locale: Schema.String,
  name: Schema.String,
  email: Schema.NullOr(Schema.String),
  permissions: Schema.Struct({
    views: Schema.Array(Schema.String)
  }),
  roles: Schema.Array(Schema.String)
});

export const HolidaySchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  start: Schema.String,
  end: Schema.String,
  bookable: Schema.Boolean
});

export const AppDataSchema = Schema.Struct({
  currentSchoolYear: SchoolyearWithTimeGridSchema,
  tenant: TenantSchema,
  user: UserSchema,
  permissions: Schema.Array(Schema.String),
  settings: Schema.Array(Schema.String),
  holidays: Schema.Array(HolidaySchema)
});

export type AppData = Schema.Schema.Type<typeof AppDataSchema>;

export const MessagesStatusSchema = Schema.Struct({
  unreadMessagesCount: Schema.Number
});

export type MessagesStatus = Schema.Schema.Type<typeof MessagesStatusSchema>;

export const MessagesPermissionsSchema = Schema.Struct({
  recipientOptions: Schema.Array(Schema.String),
  allowRequestReadConfirmation: Schema.Boolean,
  recipientSearchMaxResult: Schema.Number,
  showDraftsTab: Schema.Boolean,
  showSentTab: Schema.Boolean,
  canForbidReplies: Schema.Boolean,
  maxFileSize: Schema.Number,
  maxFileCount: Schema.Number
});

export type MessagesPermissions = Schema.Schema.Type<typeof MessagesPermissionsSchema>;

export const UserContactDataSchema = Schema.Struct({
  email: Schema.NullOr(Schema.String),
  telephoneNumber: Schema.NullOr(Schema.String),
  mobileNumber: Schema.NullOr(Schema.String),
  street: Schema.NullOr(Schema.String),
  postCode: Schema.NullOr(Schema.String),
  city: Schema.NullOr(Schema.String),
  areContactDetailsWriteable: Schema.Boolean,
  userEmailMissingOrDifferentToMasterData: Schema.Boolean
});

export type UserContactData = Schema.Schema.Type<typeof UserContactDataSchema>;

export const UserEmailSchema = Schema.Struct({
  email: Schema.String
});

export type UserEmail = Schema.Schema.Type<typeof UserEmailSchema>;

export const SessionStatusSchema = Schema.Struct({
  expiresInMs: Schema.Number
});

export type SessionStatus = Schema.Schema.Type<typeof SessionStatusSchema>;

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
  timeGridType: Schema.String,
  timeGridDays: Schema.Array(Schema.String),
  timeGridSlots: Schema.Array(
    Schema.Struct({
      name: Schema.NullOr(Schema.String),
      number: Schema.NullOr(Schema.Number),
      duration: TimeRangeSchema
    })
  )
});

export const TimetableGridSchema = Schema.Struct({
  firstDayOfWeek: Schema.String,
  studentFormat: Schema.Number,
  classFormat: Schema.Number,
  subjectFormat: Schema.Number,
  teacherFormat: Schema.Number,
  roomFormat: Schema.Number,
  resourceFormat: Schema.Number,
  formatDefinitions: Schema.Array(TimetableFormatDefinitionSchema)
});

export type TimetableGrid = Schema.Schema.Type<typeof TimetableGridSchema>;

export const TimetableSearchResultSchema = Schema.Struct({
  type: Schema.String,
  resource: Schema.Struct({
    id: Schema.Number,
    shortName: Schema.String,
    longName: Schema.String,
    displayName: Schema.String
  }),
  imageUrl: Schema.NullOr(Schema.String)
});

export type TimetableSearchResult = Schema.Schema.Type<typeof TimetableSearchResultSchema>;

export const TimetableMenuSchema = Schema.Struct({
  myTimetable: Schema.NullOr(TimetableSearchResultSchema),
  dependents: Schema.Array(TimetableSearchResultSchema),
  availableTimetables: Schema.Array(Schema.String)
});

export type TimetableMenu = Schema.Schema.Type<typeof TimetableMenuSchema>;

export const TimetableSearchSchema = Schema.Struct({
  numPartialMatches: Schema.Number,
  results: Schema.Array(TimetableSearchResultSchema)
});

export type TimetableSearch = Schema.Schema.Type<typeof TimetableSearchSchema>;
export type TimetableSearchResults = TimetableSearch;

export const DisplayResourceSchema = Schema.Struct({
  id: Schema.Number,
  shortName: Schema.String,
  longName: Schema.String,
  displayName: Schema.String
});

export const TimetableDepartmentSchema = Schema.Struct({
  id: Schema.Number,
  shortName: Schema.String,
  longName: Schema.String,
  displayName: Schema.String
});

export const TimetableClassFilterItemSchema = Schema.Struct({
  class: DisplayResourceSchema,
  classTeacher1: Schema.NullOr(DisplayResourceSchema),
  classTeacher2: Schema.NullOr(DisplayResourceSchema),
  department: TimetableDepartmentSchema
});

export const TimetableFilterSchema = Schema.Struct({
  resourceType: Schema.String,
  preSelected: Schema.NullOr(Schema.Unknown),
  buildings: Schema.Array(Schema.Unknown),
  departments: Schema.Array(TimetableDepartmentSchema),
  roomGroups: Schema.Array(Schema.Unknown),
  resourceTypes: Schema.Array(Schema.Unknown),
  assignmentGroups: Schema.Array(Schema.Unknown),
  classes: Schema.Array(TimetableClassFilterItemSchema),
  resources: Schema.Array(Schema.Unknown),
  rooms: Schema.Array(Schema.Unknown),
  subjects: Schema.Array(Schema.Unknown),
  students: Schema.Array(Schema.Unknown),
  teachers: Schema.Array(Schema.Unknown)
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
  highlightExternalEntries: Schema.Boolean
});

export type TimetableEntriesSettings = Schema.Schema.Type<typeof TimetableEntriesSettingsSchema>;

export const TimetableEntryDaySchema = Schema.Struct({
  date: Schema.String,
  resourceType: Schema.String,
  resource: Schema.Struct({
    id: Schema.Number,
    shortName: Schema.String,
    longName: Schema.String,
    displayName: Schema.String
  }),
  status: Schema.String,
  dayEntries: Schema.Array(Schema.Unknown),
  gridEntries: Schema.Array(Schema.Unknown),
  backEntries: Schema.Array(Schema.Unknown)
});

export const TimetableEntriesSchema = Schema.Struct({
  format: Schema.Number,
  days: Schema.Array(TimetableEntryDaySchema),
  errors: Schema.Array(Schema.Unknown)
});

export type TimetableEntries = Schema.Schema.Type<typeof TimetableEntriesSchema>;
