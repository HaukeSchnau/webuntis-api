import { Context, Effect, Layer } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import {
  type ExamDateRangeRequest,
  type ExamDetailRequest,
  type ExamsListRequest,
  ExamsRequests,
} from "./requests.ts";
import type { ExamDetail, ExamFilter, ExamsForClass, ExamStatistics, Exams } from "./schema.ts";

export interface ExamsClientShape {
  readonly list: (request?: ExamsListRequest) => Effect.Effect<Exams, RequestFailure>;
  readonly getFilter: (request?: ExamDateRangeRequest) => Effect.Effect<ExamFilter, RequestFailure>;
  readonly getStatistics: (
    request?: ExamDateRangeRequest,
  ) => Effect.Effect<ExamStatistics, RequestFailure>;
  readonly getExam: (request: ExamDetailRequest) => Effect.Effect<ExamDetail, RequestFailure>;
  readonly getForClass: () => Effect.Effect<ExamsForClass, RequestFailure>;
}

export class ExamsClient extends Context.Service<ExamsClient, ExamsClientShape>()(
  "webuntis/ExamsClient",
) {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return ExamsClient.of({
        list: Effect.fn("ExamsClient.list")(function* (request?: ExamsListRequest) {
          return yield* http.requestSchema(ExamsRequests.list, request);
        }),
        getFilter: Effect.fn("ExamsClient.getFilter")(function* (request?: ExamDateRangeRequest) {
          return yield* http.requestSchema(ExamsRequests.getFilter, request);
        }),
        getStatistics: Effect.fn("ExamsClient.getStatistics")(function* (
          request?: ExamDateRangeRequest,
        ) {
          return yield* http.requestSchema(ExamsRequests.getStatistics, request);
        }),
        getExam: Effect.fn("ExamsClient.getExam")(function* (request: ExamDetailRequest) {
          return yield* http.requestSchema(ExamsRequests.getExam, request);
        }),
        getForClass: Effect.fn("ExamsClient.getForClass")(function* () {
          return yield* http.requestSchema(ExamsRequests.getForClass, undefined);
        }),
      });
    }),
  );
}

export type { ExamDateRangeRequest, ExamDetailRequest, ExamsListRequest } from "./requests.ts";
