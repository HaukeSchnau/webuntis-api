import { Schema } from "effect";
import { EntityId } from "../../internal/schema.ts";
import { DisplayResourceSchema, JsonObjectSchema } from "../shared/schema.ts";

export const ExamTypeSchema = Schema.Struct({
  ...DisplayResourceSchema.fields,
  gradingScaleId: EntityId,
});

export type ExamType = typeof ExamTypeSchema.Type;

export const ExamStudentSchema = Schema.Struct({
  ...DisplayResourceSchema.fields,
  gender: Schema.NullOr(Schema.String),
  klasse: Schema.NullOr(Schema.String),
  imageUrl: Schema.String,
  gradeProtection: Schema.Boolean,
  disadvantageCompensation: Schema.Boolean,
});

export type ExamStudent = typeof ExamStudentSchema.Type;

export const ExamInvigilatorSchema = Schema.Struct({
  start: Schema.String,
  end: Schema.String,
  teachers: Schema.Array(DisplayResourceSchema),
});

export type ExamInvigilator = typeof ExamInvigilatorSchema.Type;

export const ExamSchema = Schema.Struct({
  examId: EntityId,
  examType: ExamTypeSchema,
  gradingScale: DisplayResourceSchema,
  examName: Schema.String,
  examText: Schema.String,
  examStart: Schema.String,
  examEnd: Schema.String,
  examDuration: Schema.Int,
  examBooked: Schema.String,
  examBookedUser: DisplayResourceSchema,
  examReturned: Schema.NullOr(Schema.String),
  examReturnedUser: Schema.NullOr(DisplayResourceSchema),
  examModified: Schema.String,
  examModifiedUser: DisplayResourceSchema,
  numStudents: Schema.Int,
  subject: DisplayResourceSchema,
  classes: Schema.Array(DisplayResourceSchema),
  teachers: Schema.Array(DisplayResourceSchema),
  studentgroup: DisplayResourceSchema,
  students: Schema.Array(ExamStudentSchema),
  invigilators: Schema.Array(ExamInvigilatorSchema),
  rooms: Schema.Array(DisplayResourceSchema),
  lessonId: EntityId,
  exported: Schema.Boolean,
  deleted: Schema.Boolean,
  isUntisExam: Schema.Boolean,
  canEdit: Schema.Boolean,
  canDelete: Schema.Boolean,
  canReadGrades: Schema.Boolean,
  canWriteGrades: Schema.Boolean,
});

export type Exam = typeof ExamSchema.Type;

export const ExamsSchema = Schema.Struct({
  exams: Schema.Array(ExamSchema),
  withDeleted: Schema.Boolean,
});

export type Exams = typeof ExamsSchema.Type;

export const ExamsForClassSchema = Schema.Struct({
  examsDone: Schema.Array(JsonObjectSchema),
  examsUpcoming: Schema.Array(JsonObjectSchema),
  examsFuture: Schema.Array(JsonObjectSchema),
});

export type ExamsForClass = typeof ExamsForClassSchema.Type;

export const ExamFilterSchema = Schema.Struct({
  examTypes: Schema.Array(DisplayResourceSchema),
  subjects: Schema.Array(DisplayResourceSchema),
  classes: Schema.Array(DisplayResourceSchema),
  teachers: Schema.Array(DisplayResourceSchema),
});

export type ExamFilter = typeof ExamFilterSchema.Type;

export const ExamGradingScaleMarkSchema = Schema.Struct({
  name: Schema.String,
  value: Schema.Finite,
});

export type ExamGradingScaleMark = typeof ExamGradingScaleMarkSchema.Type;

export const ExamGradingScaleWithMarksSchema = Schema.Struct({
  ...DisplayResourceSchema.fields,
  marks: Schema.Array(ExamGradingScaleMarkSchema),
});

export type ExamGradingScaleWithMarks = typeof ExamGradingScaleWithMarksSchema.Type;

export const ExamGradeSchema = Schema.Struct({
  id: EntityId,
  displayName: Schema.String,
  weight: Schema.Finite,
});

export type ExamGrade = typeof ExamGradeSchema.Type;

export const ExamStatisticsEntrySchema = Schema.Struct({
  exam: ExamSchema,
  gradingScale: ExamGradingScaleWithMarksSchema,
  grades: Schema.Array(ExamGradeSchema),
  numParticipants: Schema.Int,
  numParticipantsWithGrade: Schema.Int,
  resultSource: Schema.String,
  averageGrade: Schema.Finite,
  countPerGrade: Schema.Array(Schema.Unknown),
});

export type ExamStatisticsEntry = typeof ExamStatisticsEntrySchema.Type;

export const ExamStatisticsSchema = Schema.Struct({
  exams: Schema.Array(ExamStatisticsEntrySchema),
});

export type ExamStatistics = typeof ExamStatisticsSchema.Type;

export const ExamDetailSchema = ExamSchema;

export type ExamDetail = typeof ExamDetailSchema.Type;
