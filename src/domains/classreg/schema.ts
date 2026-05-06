import { Schema } from "effect";
import { DateRangeSchema, JsonObjectSchema } from "../shared/schema.ts";

export const ClassregIdNameSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
});

export const ClassregIdNameShortSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  nameShort: Schema.String,
});

export const ClassregExcuseStatusTypeSchema = Schema.Literals(["OPEN", "EXCUSED", "NOT_EXCUSED"]);

export const ClassregAbsenceReasonSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  automaticNotificationEnabled: Schema.Boolean,
});

export const ClassregExcuseStatusSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  type: ClassregExcuseStatusTypeSchema,
});

export const ClassregAbsencesMetaSchema = Schema.Struct({
  canEditReason: Schema.Boolean,
  classes: Schema.Array(ClassregIdNameSchema),
  defaultReasonId: Schema.NullOr(Schema.Number),
  defaultExcuseStatusId: Schema.NullOr(Schema.Number),
  reasons: Schema.Array(ClassregAbsenceReasonSchema),
  excuseStatuses: Schema.Array(ClassregExcuseStatusSchema),
  assignmentGroups: Schema.Array(Schema.Unknown),
  filterIsActiveForMissingAbsenceParentNotification: Schema.Boolean,
});

export type ClassregAbsencesMeta = Schema.Schema.Type<typeof ClassregAbsencesMetaSchema>;

export const ClassregHomeworkMetaSchoolyearSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  dateRange: DateRangeSchema,
  parentId: Schema.Number,
});

export const ClassregHomeworkMetaSchema = Schema.Struct({
  classes: Schema.Array(ClassregIdNameShortSchema),
  teachers: Schema.Array(ClassregIdNameShortSchema),
  subjects: Schema.Array(ClassregIdNameShortSchema),
  schoolYears: Schema.Array(ClassregHomeworkMetaSchoolyearSchema),
});

export type ClassregHomeworkMeta = Schema.Schema.Type<typeof ClassregHomeworkMetaSchema>;

export const ClassregHomeworkDateRangeTypeSchema = Schema.Literals(["WEEK", "SCHOOLYEAR"]);

export type ClassregHomeworkDateRangeType = Schema.Schema.Type<
  typeof ClassregHomeworkDateRangeTypeSchema
>;

export const ClassregHomeworkItemSchema = Schema.Struct({
  attachments: Schema.Array(JsonObjectSchema),
  id: Schema.Number,
  createdByUser: Schema.String,
  lessonId: Schema.Number,
  completed: Schema.Boolean,
  date: Schema.String,
  dueDate: Schema.String,
  remark: Schema.String,
  subject: Schema.NullOr(ClassregIdNameShortSchema),
  homework: Schema.String,
});

export const ClassregHomeworkListSchema = Schema.Struct({
  homeworkList: Schema.Array(ClassregHomeworkItemSchema),
});

export type ClassregHomeworkList = Schema.Schema.Type<typeof ClassregHomeworkListSchema>;

export const ClassregLessonTopicsMetaSchema = Schema.Struct({
  teachingMethods: Schema.Array(Schema.Unknown),
  blockTopicAllowed: Schema.Boolean,
  futureTopicAllowed: Schema.Boolean,
  oneDriveAllowed: Schema.Boolean,
});

export type ClassregLessonTopicsMeta = Schema.Schema.Type<typeof ClassregLessonTopicsMetaSchema>;
