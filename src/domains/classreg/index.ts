import { Context, Effect, Layer } from "effect";
import { makeOperations } from "../../internal/domain.ts";
import type { WebUntisError } from "../../internal/errors.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import { type ClassregHomeworkListRequest, ClassregRequests } from "./requests.ts";
import type {
  ClassregAbsencesMeta,
  ClassregHomeworkList,
  ClassregHomeworkMeta,
  ClassregLessonTopicsMeta,
} from "./schema.ts";

export interface ClassregClientShape {
  readonly getAbsencesMeta: Effect.Effect<ClassregAbsencesMeta, WebUntisError>;
  readonly getHomeworkMeta: Effect.Effect<ClassregHomeworkMeta, WebUntisError>;
  readonly getHomeworkList: (
    request: ClassregHomeworkListRequest,
  ) => Effect.Effect<ClassregHomeworkList, WebUntisError>;
  readonly getLessonTopicsMeta: Effect.Effect<ClassregLessonTopicsMeta, WebUntisError>;
}

export class ClassregClient extends Context.Service<ClassregClient, ClassregClientShape>()(
  "webuntis/ClassregClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { read, call } = makeOperations(yield* WebUntisHttp, "ClassregClient");

      return ClassregClient.of({
        getAbsencesMeta: read("getAbsencesMeta", ClassregRequests.getAbsencesMeta),
        getHomeworkMeta: read("getHomeworkMeta", ClassregRequests.getHomeworkMeta),
        getHomeworkList: call("getHomeworkList", ClassregRequests.getHomeworkList),
        getLessonTopicsMeta: read("getLessonTopicsMeta", ClassregRequests.getLessonTopicsMeta),
      });
    }),
  );
}

export type { ClassregHomeworkListRequest };
