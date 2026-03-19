import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import {
  ExamDetailSchema,
  ExamFilterSchema,
  ExamsSchema,
  ExamStatisticsSchema
} from "./schemas/exams.ts";

export const makeExamsClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    list: http.getSchema("api/rest/view/v1/exams", ExamsSchema, {
      withSchoolYearHeader: false
    }),
    getFilter: http.getSchema("api/rest/view/v1/exams/filter", ExamFilterSchema, {
      withSchoolYearHeader: false
    }),
    getStatistics: http.getSchema("api/rest/view/v1/exams/statistics", ExamStatisticsSchema, {
      withSchoolYearHeader: false
    }),
    getExam: (id: number) =>
      http.getSchema(`api/rest/view/v1/exams/${id}`, ExamDetailSchema, {
        withSchoolYearHeader: false
      })
  };
});
