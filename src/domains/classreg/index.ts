import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import { ClassregRequests } from "./requests.ts";
import type { ClassregAbsencesMeta, ClassregHomeworkMeta } from "./schema.ts";

export interface ClassregClientShape {
  readonly getAbsencesMeta: () => Effect.Effect<
    ClassregAbsencesMeta,
    RequestFailure
  >;
  readonly getHomeworkMeta: () => Effect.Effect<
    ClassregHomeworkMeta,
    RequestFailure
  >;
}

export class ClassregClient extends ServiceMap.Service<
  ClassregClient,
  ClassregClientShape
>()("webuntis/ClassregClient") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return ClassregClient.of({
        getAbsencesMeta: Effect.fn("ClassregClient.getAbsencesMeta")(
          function* () {
            return yield* http.requestSchema(
              ClassregRequests.getAbsencesMeta,
              undefined,
            );
          },
        ),
        getHomeworkMeta: Effect.fn("ClassregClient.getHomeworkMeta")(
          function* () {
            return yield* http.requestSchema(
              ClassregRequests.getHomeworkMeta,
              undefined,
            );
          },
        ),
      });
    }),
  );
}
