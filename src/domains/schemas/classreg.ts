import { Schema } from "effect";
import { DateRangeSchema } from "./shared.ts";

export const ClassregIdNameSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
});

export const ClassregIdNameShortSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  nameShort: Schema.String,
});

export const ClassregExcuseStatusTypeSchema = Schema.Literals([
  "OPEN",
  "EXCUSED",
  "NOT_EXCUSED",
]);

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

export type ClassregAbsencesMeta = Schema.Schema.Type<
  typeof ClassregAbsencesMetaSchema
>;

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

export type ClassregHomeworkMeta = Schema.Schema.Type<
  typeof ClassregHomeworkMetaSchema
>;
