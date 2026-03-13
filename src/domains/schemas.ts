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

export const MessageSenderSchema = Schema.Struct({
  className: Schema.NullOr(Schema.String),
  displayName: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  userId: Schema.Number
});

export const MessageSummarySchema = Schema.Struct({
  id: Schema.Number,
  subject: Schema.String,
  contentPreview: Schema.NullOr(Schema.String),
  sender: MessageSenderSchema,
  sentDateTime: Schema.String,
  allowMessageDeletion: Schema.Boolean,
  hasAttachments: Schema.Boolean,
  isMessageRead: Schema.Boolean,
  isReply: Schema.Boolean,
  isReplyAllowed: Schema.Boolean
});

export type MessageSummary = Schema.Schema.Type<typeof MessageSummarySchema>;

export const MessagesInboxSchema = Schema.Struct({
  incomingMessages: Schema.Array(MessageSummarySchema),
  readConfirmationMessages: Schema.Array(Schema.Unknown)
});

export type MessagesInbox = Schema.Schema.Type<typeof MessagesInboxSchema>;

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

export const MessageQuickfilterItemSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  personCount: Schema.Number,
  deletable: Schema.Boolean,
  editable: Schema.Boolean,
  publicAccess: Schema.Boolean,
  dynamic: Schema.Boolean
});

export const MessageRecipientQuickfiltersSchema = Schema.Struct({
  canCreatePublic: Schema.Boolean,
  items: Schema.Array(MessageQuickfilterItemSchema)
});

export type MessageRecipientQuickfilters = Schema.Schema.Type<typeof MessageRecipientQuickfiltersSchema>;

export const MessageRecipientFilterGroupSchema = Schema.Struct({
  type: Schema.String,
  items: Schema.Array(Schema.String)
});

export const MessageRecipientFilterSchema = Schema.Struct({
  filters: Schema.Array(MessageRecipientFilterGroupSchema)
});

export type MessageRecipientFilter = Schema.Schema.Type<typeof MessageRecipientFilterSchema>;

export const MessageRecipientSearchResultSchema = Schema.Struct({
  personId: Schema.Number,
  className: Schema.NullOr(Schema.String),
  displayName: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  role: Schema.String
});

export const MessageRecipientSearchSchema = Schema.Array(MessageRecipientSearchResultSchema);

export type MessageRecipientSearch = Schema.Schema.Type<typeof MessageRecipientSearchSchema>;

export const MessageDetailSchema = Schema.Struct({
  id: Schema.Number,
  subject: Schema.String,
  content: Schema.NullOr(Schema.String),
  sender: MessageSenderSchema,
  sentDateTime: Schema.String,
  allowMessageDeletion: Schema.Boolean,
  attachments: Schema.Array(Schema.Unknown),
  blobAttachment: Schema.NullOr(Schema.Unknown),
  storageAttachments: Schema.Array(Schema.Unknown),
  isReply: Schema.Boolean,
  isReplyAllowed: Schema.Boolean,
  isReportMessage: Schema.Boolean,
  isReplyForbidden: Schema.Boolean,
  replyHistory: Schema.Array(Schema.Unknown),
  requestConfirmation: Schema.NullOr(Schema.Unknown)
});

export type MessageDetail = Schema.Schema.Type<typeof MessageDetailSchema>;

export const MessageReplyHistoryItemSchema = Schema.Struct({
  id: Schema.Number,
  subject: Schema.String,
  content: Schema.NullOr(Schema.String),
  sender: MessageSenderSchema,
  recipients: Schema.Array(Schema.Unknown),
  sentDateTime: Schema.String,
  isRevoked: Schema.Boolean,
  attachments: Schema.Array(Schema.Unknown),
  blobAttachment: Schema.NullOr(Schema.Unknown),
  storageAttachments: Schema.Array(Schema.Unknown)
});

export const MessageReplyFormSchema = Schema.Struct({
  subject: Schema.String,
  recipient: Schema.Struct({
    id: Schema.Number,
    className: Schema.NullOr(Schema.String),
    displayName: Schema.String
  }),
  replyHistory: Schema.Array(MessageReplyHistoryItemSchema)
});

export type MessageReplyForm = Schema.Schema.Type<typeof MessageReplyFormSchema>;

export const MessageDraftSummarySchema = Schema.Struct({
  id: Schema.Number,
  subject: Schema.String,
  contentPreview: Schema.NullOr(Schema.String),
  hasAttachments: Schema.Boolean
});

export const MessageDraftsSchema = Schema.Struct({
  draftMessages: Schema.Array(MessageDraftSummarySchema)
});

export type MessageDrafts = Schema.Schema.Type<typeof MessageDraftsSchema>;

export const MessageSentSummarySchema = Schema.Struct({
  id: Schema.Number,
  subject: Schema.String,
  contentPreview: Schema.NullOr(Schema.String),
  sentDateTime: Schema.String,
  hasAttachments: Schema.Boolean
});

export const MessageSentSchema = Schema.Struct({
  sentMessages: Schema.Array(MessageSentSummarySchema)
});

export type MessageSent = Schema.Schema.Type<typeof MessageSentSchema>;

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

export const HomeCellSchema = Schema.Struct({
  badge: Schema.NullOr(Schema.Unknown),
  type: Schema.String
});

export const HomeSectionSchema = Schema.Struct({
  cells: Schema.Array(HomeCellSchema)
});

export const HomeSchema = Schema.Struct({
  schoolName: Schema.String,
  sections: Schema.Array(HomeSectionSchema),
  integrationsSection: Schema.Array(Schema.Unknown),
  isEmailUpdateRequired: Schema.Boolean
});

export type Home = Schema.Schema.Type<typeof HomeSchema>;

export const MobileTenantSchema = Schema.Struct({
  id: Schema.String,
  displayName: Schema.String,
  wuVersion: Schema.String,
  language: Schema.String
});

export const MobileUserSchema = Schema.Struct({
  id: Schema.Number,
  username: Schema.String,
  person: Schema.NullOr(Schema.Unknown),
  referencedStudents: Schema.Array(Schema.Unknown),
  locale: Schema.String,
  departmentId: Schema.Number,
  role: Schema.String,
  permissions: Schema.Array(Schema.String)
});

export const MobileDataSchema = Schema.Struct({
  schoolYear: SchoolyearSchema,
  tenant: MobileTenantSchema,
  user: MobileUserSchema
});

export type MobileData = Schema.Schema.Type<typeof MobileDataSchema>;

export const StartupActionsSchema = Schema.Struct({
  startupActions: Schema.Array(Schema.Unknown)
});

export type StartupActions = Schema.Schema.Type<typeof StartupActionsSchema>;

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

export const TimetableAvailableRoomSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  longName: Schema.String,
  displayName: Schema.String
});

export const TimetableAvailableRoomsSchema = Schema.Array(TimetableAvailableRoomSchema);

export type TimetableAvailableRoom = Schema.Schema.Type<typeof TimetableAvailableRoomSchema>;
export type TimetableAvailableRooms = Schema.Schema.Type<typeof TimetableAvailableRoomsSchema>;

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

export const TimetableCalendarSchema = Schema.Struct({
  integrations: Schema.Array(Schema.Unknown)
});

export type TimetableCalendar = Schema.Schema.Type<typeof TimetableCalendarSchema>;
