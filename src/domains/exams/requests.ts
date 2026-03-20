import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import {
  ExamDetailSchema,
  ExamFilterSchema,
  ExamStatisticsSchema,
  ExamsSchema,
} from "./schema.ts";

export const ExamsRequests = {
  list: schemaRequest<void, typeof ExamsSchema>({
    method: "GET",
    path: "api/rest/view/v1/exams",
    policy: RequestPolicy.AuthOnly,
    schema: ExamsSchema,
  }),
  getFilter: schemaRequest<void, typeof ExamFilterSchema>({
    method: "GET",
    path: "api/rest/view/v1/exams/filter",
    policy: RequestPolicy.AuthOnly,
    schema: ExamFilterSchema,
  }),
  getStatistics: schemaRequest<void, typeof ExamStatisticsSchema>({
    method: "GET",
    path: "api/rest/view/v1/exams/statistics",
    policy: RequestPolicy.AuthOnly,
    schema: ExamStatisticsSchema,
  }),
  getExam: schemaRequest<number, typeof ExamDetailSchema>({
    method: "GET",
    path: (id) => `api/rest/view/v1/exams/${id}`,
    policy: RequestPolicy.AuthOnly,
    schema: ExamDetailSchema,
  }),
} as const;
