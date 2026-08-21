import { Schema } from "effect";
import { IsoDate, PositiveInteger, RequestPolicy, schemaRequest } from "../../internal/request.ts";
import {
  ExamDetailSchema,
  ExamFilterSchema,
  ExamsForClassSchema,
  ExamStatisticsSchema,
  ExamsSchema,
} from "./schema.ts";

const ExamDetailInput = Schema.Struct({ id: PositiveInteger });

/**
 * Either both range boundaries or neither. The `Schema.Never` branch keeps the
 * "absent" case explicit so a caller cannot pass just one boundary.
 */
const coherentOptionalDateRange = Schema.makeFilter<{
  readonly start?: string | undefined;
  readonly end?: string | undefined;
}>((range) =>
  range.start === undefined || range.end === undefined || range.start <= range.end
    ? undefined
    : { path: ["end"], issue: "must not be before start" },
);

const ExamDateRangeInput = Schema.Union([
  Schema.Struct({ start: IsoDate, end: IsoDate }),
  Schema.Struct({ start: Schema.optional(Schema.Never), end: Schema.optional(Schema.Never) }),
]).check(coherentOptionalDateRange);

const ExamsListInput = Schema.Union([
  Schema.Struct({
    start: IsoDate,
    end: IsoDate,
    withDeleted: Schema.optional(Schema.Boolean),
  }),
  Schema.Struct({
    start: Schema.optional(Schema.Never),
    end: Schema.optional(Schema.Never),
    withDeleted: Schema.optional(Schema.Boolean),
  }),
]).check(coherentOptionalDateRange);

export type ExamDetailRequest = typeof ExamDetailInput.Type;
export type ExamDateRangeRequest = typeof ExamDateRangeInput.Type;
export type ExamsListRequest = typeof ExamsListInput.Type;

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
    supportsSchoolYearScope: true,
    inputSchema: Schema.UndefinedOr(ExamsListInput),
    schema: ExamsSchema,
  }),
  getFilter: schemaRequest<ExamDateRangeRequest | undefined, typeof ExamFilterSchema>({
    method: "GET",
    path: "api/rest/view/v1/exams/filter",
    query: (request) => ({ start: request?.start, end: request?.end }),
    policy: RequestPolicy.AuthOnly,
    supportsSchoolYearScope: true,
    inputSchema: Schema.UndefinedOr(ExamDateRangeInput),
    schema: ExamFilterSchema,
  }),
  getStatistics: schemaRequest<ExamDateRangeRequest | undefined, typeof ExamStatisticsSchema>({
    method: "GET",
    path: "api/rest/view/v1/exams/statistics",
    query: (request) => ({ start: request?.start, end: request?.end }),
    policy: RequestPolicy.AuthOnly,
    supportsSchoolYearScope: true,
    inputSchema: Schema.UndefinedOr(ExamDateRangeInput),
    schema: ExamStatisticsSchema,
  }),
  getExam: schemaRequest<ExamDetailRequest, typeof ExamDetailSchema>({
    method: "GET",
    operation: "api/rest/view/v1/exams/{id}",
    path: (request) => `api/rest/view/v1/exams/${request.id}`,
    policy: RequestPolicy.AuthOnly,
    inputSchema: ExamDetailInput,
    supportsSchoolYearScope: true,
    schema: ExamDetailSchema,
  }),
  getForClass: schemaRequest<void, typeof ExamsForClassSchema>({
    method: "GET",
    path: "api/rest/view/v1/exams/for-class",
    policy: RequestPolicy.AuthOnly,
    supportsSchoolYearScope: true,
    schema: ExamsForClassSchema,
  }),
} as const;
