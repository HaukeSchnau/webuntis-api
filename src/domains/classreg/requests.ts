import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import {
  ClassregAbsencesMetaSchema,
  type ClassregHomeworkDateRangeType,
  ClassregHomeworkListSchema,
  ClassregHomeworkMetaSchema,
  ClassregLessonTopicsMetaSchema,
} from "./schema.ts";

export interface ClassregHomeworkListRequest {
  readonly classId: number | null;
  readonly teacherId: number | null;
  readonly subjectId: number | null;
  readonly dateRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly dateRangeType: ClassregHomeworkDateRangeType;
}

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
