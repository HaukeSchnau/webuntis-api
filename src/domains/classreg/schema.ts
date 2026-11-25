import { Schema } from "effect";
import { EntityId } from "../../internal/schema.ts";
import { DateRangeSchema, JsonObjectSchema } from "../shared/schema.ts";

export const ClassregIdNameSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
});

export type ClassregIdName = typeof ClassregIdNameSchema.Type;

export const ClassregIdNameShortSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  nameShort: Schema.String,
});

export type ClassregIdNameShort = typeof ClassregIdNameShortSchema.Type;

export const ClassregExcuseStatusTypeSchema = Schema.Literals(["OPEN", "EXCUSED", "NOT_EXCUSED"]);

export type ClassregExcuseStatusType = typeof ClassregExcuseStatusTypeSchema.Type;

export const ClassregAbsenceReasonSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  automaticNotificationEnabled: Schema.Boolean,
});

export type ClassregAbsenceReason = typeof ClassregAbsenceReasonSchema.Type;

export const ClassregExcuseStatusSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  type: ClassregExcuseStatusTypeSchema,
});

export type ClassregExcuseStatus = typeof ClassregExcuseStatusSchema.Type;

export const ClassregAbsencesMetaSchema = Schema.Struct({
  canEditReason: Schema.Boolean,
  classes: Schema.Array(ClassregIdNameSchema),
  defaultReasonId: Schema.NullOr(EntityId),
  defaultExcuseStatusId: Schema.NullOr(EntityId),
  reasons: Schema.Array(ClassregAbsenceReasonSchema),
  excuseStatuses: Schema.Array(ClassregExcuseStatusSchema),
  assignmentGroups: Schema.Array(Schema.Unknown),
  filterIsActiveForMissingAbsenceParentNotification: Schema.Boolean,
});

export type ClassregAbsencesMeta = typeof ClassregAbsencesMetaSchema.Type;

export const ClassregHomeworkMetaSchoolyearSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  dateRange: DateRangeSchema,
  parentId: EntityId,
});

export type ClassregHomeworkMetaSchoolyear = typeof ClassregHomeworkMetaSchoolyearSchema.Type;

export const ClassregHomeworkMetaSchema = Schema.Struct({
  classes: Schema.Array(ClassregIdNameShortSchema),
  teachers: Schema.Array(ClassregIdNameShortSchema),
  subjects: Schema.Array(ClassregIdNameShortSchema),
  schoolYears: Schema.Array(ClassregHomeworkMetaSchoolyearSchema),
});

export type ClassregHomeworkMeta = typeof ClassregHomeworkMetaSchema.Type;

export const ClassregHomeworkDateRangeTypeSchema = Schema.Literals(["WEEK", "SCHOOLYEAR"]);

export type ClassregHomeworkDateRangeType = typeof ClassregHomeworkDateRangeTypeSchema.Type;

export const ClassregHomeworkItemSchema = Schema.Struct({
  attachments: Schema.Array(JsonObjectSchema),
  id: EntityId,
  createdByUser: Schema.String,
  lessonId: EntityId,
  completed: Schema.Boolean,
  date: Schema.String,
  dueDate: Schema.String,
  remark: Schema.String,
  subject: Schema.NullOr(ClassregIdNameShortSchema),
  homework: Schema.String,
});

export type ClassregHomeworkItem = typeof ClassregHomeworkItemSchema.Type;

export const ClassregHomeworkListSchema = Schema.Struct({
  homeworkList: Schema.Array(ClassregHomeworkItemSchema),
});

export type ClassregHomeworkList = typeof ClassregHomeworkListSchema.Type;

export const ClassregLessonTopicsMetaSchema = Schema.Struct({
  teachingMethods: Schema.Array(Schema.Unknown),
  blockTopicAllowed: Schema.Boolean,
  futureTopicAllowed: Schema.Boolean,
  oneDriveAllowed: Schema.Boolean,
});

export type ClassregLessonTopicsMeta = typeof ClassregLessonTopicsMetaSchema.Type;
