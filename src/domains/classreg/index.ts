import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import type {
  ClassregAbsencesMeta,
  ClassregHomeworkMeta,
} from "../schemas/classreg.ts";
import { ClassregRequests } from "./requests.ts";

export interface ClassregClientShape {
  readonly getAbsencesMeta: Effect.Effect<ClassregAbsencesMeta, RequestFailure>;
  readonly getHomeworkMeta: Effect.Effect<ClassregHomeworkMeta, RequestFailure>;
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
        getAbsencesMeta: http.requestSchema(
          ClassregRequests.getAbsencesMeta,
          undefined,
        ),
        getHomeworkMeta: http.requestSchema(
          ClassregRequests.getHomeworkMeta,
          undefined,
        ),
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}
