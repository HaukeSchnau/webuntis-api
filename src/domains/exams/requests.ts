import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import { ExamDetailSchema, ExamFilterSchema, ExamStatisticsSchema, ExamsSchema } from "./schema.ts";

export interface ExamDetailRequest {
  readonly id: number;
}

export interface ExamDateRangeRequest {
  readonly start?: string | undefined;
  readonly end?: string | undefined;
}

export interface ExamsListRequest extends ExamDateRangeRequest {
  readonly withDeleted?: boolean | undefined;
}

export const ExamsRequests = {
  list: schemaRequest<ExamsListRequest | undefined, typeof ExamsSchema>({
    method: "GET",
    path: "api/rest/view/v1/exams",
    query: (request) => ({
      start: request?.start,
      end: request?.end,
      withDeleted: request?.withDeleted,
    }),
    policy: RequestPolicy.AuthOnly,
    schema: ExamsSchema,
  }),
  getFilter: schemaRequest<ExamDateRangeRequest | undefined, typeof ExamFilterSchema>({
    method: "GET",
    path: "api/rest/view/v1/exams/filter",
    query: (request) => ({ start: request?.start, end: request?.end }),
    policy: RequestPolicy.AuthOnly,
    schema: ExamFilterSchema,
  }),
  getStatistics: schemaRequest<ExamDateRangeRequest | undefined, typeof ExamStatisticsSchema>({
    method: "GET",
    path: "api/rest/view/v1/exams/statistics",
    query: (request) => ({ start: request?.start, end: request?.end }),
    policy: RequestPolicy.AuthOnly,
    schema: ExamStatisticsSchema,
  }),
  getExam: schemaRequest<ExamDetailRequest, typeof ExamDetailSchema>({
    method: "GET",
    path: (request) => `api/rest/view/v1/exams/${request.id}`,
    policy: RequestPolicy.AuthOnly,
    schema: ExamDetailSchema,
  }),
} as const;
