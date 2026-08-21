import { Schema } from "effect";
import {
  IsoDate,
  orderedRange,
  PositiveInteger,
  RequestPolicy,
  schemaRequest,
} from "../../internal/request.ts";
import {
  ClassregAbsencesMetaSchema,
  ClassregHomeworkDateRangeTypeSchema,
  ClassregHomeworkListSchema,
  ClassregHomeworkMetaSchema,
  ClassregLessonTopicsMetaSchema,
} from "./schema.ts";

const HomeworkDateRangeInput = orderedRange(
  Schema.Struct({
    start: IsoDate,
    end: IsoDate,
  }),
);

const NullablePositiveInteger = Schema.NullOr(PositiveInteger);

const ClassregHomeworkListInput = Schema.Struct({
  classId: NullablePositiveInteger,
  teacherId: NullablePositiveInteger,
  subjectId: NullablePositiveInteger,
  dateRange: HomeworkDateRangeInput,
  dateRangeType: ClassregHomeworkDateRangeTypeSchema,
});

export type ClassregHomeworkListRequest = typeof ClassregHomeworkListInput.Type;

export const ClassregRequests = {
  getAbsencesMeta: schemaRequest<void, typeof ClassregAbsencesMetaSchema>({
    method: "GET",
    path: "api/rest/view/v1/classreg/absences/meta",
    policy: RequestPolicy.AuthOnly,
    supportsSchoolYearScope: true,
    schema: ClassregAbsencesMetaSchema,
  }),
  getHomeworkMeta: schemaRequest<void, typeof ClassregHomeworkMetaSchema>({
    method: "GET",
    path: "api/rest/view/v1/classreg/homework/meta",
    policy: RequestPolicy.AuthOnly,
    supportsSchoolYearScope: true,
    schema: ClassregHomeworkMetaSchema,
  }),
  getHomeworkList: schemaRequest<ClassregHomeworkListRequest, typeof ClassregHomeworkListSchema>({
    method: "POST",
    path: "api/rest/view/v1/classreg/homework/list",
    body: (request) => request,
    policy: RequestPolicy.AuthOnly,
    inputSchema: ClassregHomeworkListInput,
    supportsSchoolYearScope: true,
    schema: ClassregHomeworkListSchema,
  }),
  getLessonTopicsMeta: schemaRequest<void, typeof ClassregLessonTopicsMetaSchema>({
    method: "GET",
    path: "api/rest/view/v1/classreg/lesson-topics/meta",
    policy: RequestPolicy.AuthOnly,
    supportsSchoolYearScope: true,
    schema: ClassregLessonTopicsMetaSchema,
  }),
} as const;
