import { Context, Effect, Layer } from "effect";
import { makeOperations } from "../../internal/domain.ts";
import type { WebUntisError } from "../../internal/errors.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import {
  type ExamDateRangeRequest,
  type ExamDetailRequest,
  ExamsRequests,
  type ExamsListRequest,
} from "./requests.ts";
import type { ExamDetail, ExamFilter, Exams, ExamsForClass, ExamStatistics } from "./schema.ts";

export interface ExamsClientShape {
  readonly list: (request?: ExamsListRequest) => Effect.Effect<Exams, WebUntisError>;
  readonly getFilter: (request?: ExamDateRangeRequest) => Effect.Effect<ExamFilter, WebUntisError>;
  readonly getStatistics: (
    request?: ExamDateRangeRequest,
  ) => Effect.Effect<ExamStatistics, WebUntisError>;
  readonly getExam: (request: ExamDetailRequest) => Effect.Effect<ExamDetail, WebUntisError>;
  readonly getForClass: Effect.Effect<ExamsForClass, WebUntisError>;
}

export class ExamsClient extends Context.Service<ExamsClient, ExamsClientShape>()(
  "webuntis/ExamsClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { read, callOptional, call } = makeOperations(yield* WebUntisHttp, "ExamsClient");

      return ExamsClient.of({
        list: callOptional("list", ExamsRequests.list, undefined),
        getFilter: callOptional("getFilter", ExamsRequests.getFilter, undefined),
        getStatistics: callOptional("getStatistics", ExamsRequests.getStatistics, undefined),
        getExam: call("getExam", ExamsRequests.getExam),
        getForClass: read("getForClass", ExamsRequests.getForClass),
      });
    }),
  );
}

export type { ExamDateRangeRequest, ExamDetailRequest, ExamsListRequest };
