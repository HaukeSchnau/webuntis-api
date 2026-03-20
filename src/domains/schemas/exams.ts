import { Schema } from "effect";

export const ExamDisplayResourceSchema = Schema.Struct({
  id: Schema.Number,
  shortName: Schema.String,
  longName: Schema.String,
  displayName: Schema.String,
});

export const ExamTypeSchema = Schema.Struct({
  id: Schema.Number,
  shortName: Schema.String,
  longName: Schema.String,
  displayName: Schema.String,
  gradingScaleId: Schema.Number,
});

export const ExamFilterTypeSchema = Schema.Struct({
  id: Schema.Number,
  shortName: Schema.String,
  longName: Schema.String,
  displayName: Schema.String,
});

export const ExamStudentSchema = Schema.Struct({
  id: Schema.Number,
  displayName: Schema.String,
  shortName: Schema.String,
  longName: Schema.String,
  gender: Schema.NullOr(Schema.String),
  klasse: Schema.NullOr(Schema.String),
  imageUrl: Schema.String,
  gradeProtection: Schema.Boolean,
  disadvantageCompensation: Schema.Boolean,
});

export const ExamInvigilatorSchema = Schema.Struct({
  start: Schema.String,
  end: Schema.String,
  teachers: Schema.Array(ExamDisplayResourceSchema),
});

export const ExamGradingScaleSchema = Schema.Struct({
  id: Schema.Number,
  shortName: Schema.String,
  longName: Schema.String,
  displayName: Schema.String,
});

export const ExamSchema = Schema.Struct({
  examId: Schema.Number,
  examType: ExamTypeSchema,
  gradingScale: ExamGradingScaleSchema,
  examName: Schema.String,
  examText: Schema.String,
  examStart: Schema.String,
  examEnd: Schema.String,
  examDuration: Schema.Number,
  examBooked: Schema.String,
  examBookedUser: ExamDisplayResourceSchema,
  examReturned: Schema.NullOr(Schema.String),
  examReturnedUser: Schema.NullOr(ExamDisplayResourceSchema),
  examModified: Schema.String,
  examModifiedUser: ExamDisplayResourceSchema,
  numStudents: Schema.Number,
  subject: ExamDisplayResourceSchema,
  classes: Schema.Array(ExamDisplayResourceSchema),
  teachers: Schema.Array(ExamDisplayResourceSchema),
  studentgroup: ExamDisplayResourceSchema,
  students: Schema.Array(ExamStudentSchema),
  invigilators: Schema.Array(ExamInvigilatorSchema),
  rooms: Schema.Array(ExamDisplayResourceSchema),
  lessonId: Schema.Number,
  exported: Schema.Boolean,
  deleted: Schema.Boolean,
  isUntisExam: Schema.Boolean,
  canEdit: Schema.Boolean,
  canDelete: Schema.Boolean,
  canReadGrades: Schema.Boolean,
  canWriteGrades: Schema.Boolean,
});

export const ExamsSchema = Schema.Struct({
  exams: Schema.Array(ExamSchema),
  withDeleted: Schema.Boolean,
});

export type Exams = Schema.Schema.Type<typeof ExamsSchema>;

export const ExamFilterSchema = Schema.Struct({
  examTypes: Schema.Array(ExamFilterTypeSchema),
  subjects: Schema.Array(ExamDisplayResourceSchema),
  classes: Schema.Array(ExamDisplayResourceSchema),
  teachers: Schema.Array(ExamDisplayResourceSchema),
});

export type ExamFilter = Schema.Schema.Type<typeof ExamFilterSchema>;

export const ExamGradingScaleMarkSchema = Schema.Struct({
  name: Schema.String,
  value: Schema.Number,
});

export const ExamGradingScaleWithMarksSchema = Schema.Struct({
  id: Schema.Number,
  shortName: Schema.String,
  longName: Schema.String,
  displayName: Schema.String,
  marks: Schema.Array(ExamGradingScaleMarkSchema),
});

export const ExamGradeSchema = Schema.Struct({
  id: Schema.Number,
  displayName: Schema.String,
  weight: Schema.Number,
});

export const ExamStatisticsEntrySchema = Schema.Struct({
  exam: ExamSchema,
  gradingScale: ExamGradingScaleWithMarksSchema,
  grades: Schema.Array(ExamGradeSchema),
  numParticipants: Schema.Number,
  numParticipantsWithGrade: Schema.Number,
  resultSource: Schema.String,
  averageGrade: Schema.Number,
  countPerGrade: Schema.Array(Schema.Unknown),
});

export const ExamStatisticsSchema = Schema.Struct({
  exams: Schema.Array(ExamStatisticsEntrySchema),
});

export type ExamStatistics = Schema.Schema.Type<typeof ExamStatisticsSchema>;

export const ExamDetailSchema = ExamSchema;

export type ExamDetail = Schema.Schema.Type<typeof ExamDetailSchema>;
