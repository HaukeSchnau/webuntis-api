import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import type {
  ExamDetail,
  ExamFilter,
  ExamStatistics,
  Exams,
} from "../schemas/exams.ts";
import { ExamsRequests } from "./requests.ts";

export interface ExamsClientShape {
  readonly list: () => Effect.Effect<Exams, RequestFailure>;
  readonly getFilter: () => Effect.Effect<ExamFilter, RequestFailure>;
  readonly getStatistics: () => Effect.Effect<ExamStatistics, RequestFailure>;
  readonly getExam: (id: number) => Effect.Effect<ExamDetail, RequestFailure>;
}

export class ExamsClient extends ServiceMap.Service<
  ExamsClient,
  ExamsClientShape
>()("webuntis/ExamsClient") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return ExamsClient.of({
        list: Effect.fn("ExamsClient.list")(function* () {
          return yield* http.requestSchema(ExamsRequests.list, undefined);
        }),
        getFilter: Effect.fn("ExamsClient.getFilter")(function* () {
          return yield* http.requestSchema(ExamsRequests.getFilter, undefined);
        }),
        getStatistics: Effect.fn("ExamsClient.getStatistics")(function* () {
          return yield* http.requestSchema(
            ExamsRequests.getStatistics,
            undefined,
          );
        }),
        getExam: Effect.fn("ExamsClient.getExam")(function* (id: number) {
          return yield* http.requestSchema(ExamsRequests.getExam, id);
        }),
      });
    }),
  );
}
