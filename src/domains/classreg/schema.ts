import { Schema } from "effect";
import { EntityId } from "../../internal/schema.ts";
import { DateRangeSchema, JsonObjectSchema } from "../shared/schema.ts";

export const ClassregIdNameSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
});

export type ClassregIdName = Schema.Schema.Type<typeof ClassregIdNameSchema>;

export const ClassregIdNameShortSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  nameShort: Schema.String,
});

export type ClassregIdNameShort = Schema.Schema.Type<typeof ClassregIdNameShortSchema>;

export const ClassregExcuseStatusTypeSchema = Schema.Literals(["OPEN", "EXCUSED", "NOT_EXCUSED"]);

export type ClassregExcuseStatusType = Schema.Schema.Type<typeof ClassregExcuseStatusTypeSchema>;

export const ClassregAbsenceReasonSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  automaticNotificationEnabled: Schema.Boolean,
});

export type ClassregAbsenceReason = Schema.Schema.Type<typeof ClassregAbsenceReasonSchema>;

export const ClassregExcuseStatusSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  type: ClassregExcuseStatusTypeSchema,
});

export type ClassregExcuseStatus = Schema.Schema.Type<typeof ClassregExcuseStatusSchema>;

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

export type ClassregAbsencesMeta = Schema.Schema.Type<typeof ClassregAbsencesMetaSchema>;

export const ClassregHomeworkMetaSchoolyearSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  dateRange: DateRangeSchema,
  parentId: EntityId,
});

export type ClassregHomeworkMetaSchoolyear = Schema.Schema.Type<
  typeof ClassregHomeworkMetaSchoolyearSchema
>;

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

export type ClassregHomeworkItem = Schema.Schema.Type<typeof ClassregHomeworkItemSchema>;

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
