import { Context, Effect, Layer } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import { type ClassregHomeworkListRequest, ClassregRequests } from "./requests.ts";
import type {
  ClassregAbsencesMeta,
  ClassregHomeworkList,
  ClassregHomeworkMeta,
  ClassregLessonTopicsMeta,
} from "./schema.ts";

export interface ClassregClientShape {
  readonly getAbsencesMeta: Effect.Effect<ClassregAbsencesMeta, RequestFailure>;
  readonly getHomeworkMeta: Effect.Effect<ClassregHomeworkMeta, RequestFailure>;
  readonly getHomeworkList: (
    request: ClassregHomeworkListRequest,
  ) => Effect.Effect<ClassregHomeworkList, RequestFailure>;
  readonly getLessonTopicsMeta: Effect.Effect<ClassregLessonTopicsMeta, RequestFailure>;
}

export class ClassregClient extends Context.Service<ClassregClient, ClassregClientShape>()(
  "webuntis/ClassregClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return ClassregClient.of({
        getAbsencesMeta: http
          .requestSchema(ClassregRequests.getAbsencesMeta, undefined)
          .pipe(Effect.withSpan("ClassregClient.getAbsencesMeta")),
        getHomeworkMeta: http
          .requestSchema(ClassregRequests.getHomeworkMeta, undefined)
          .pipe(Effect.withSpan("ClassregClient.getHomeworkMeta")),
        getHomeworkList: Effect.fn("ClassregClient.getHomeworkList")(function* (
          request: ClassregHomeworkListRequest,
        ) {
          return yield* http.requestSchema(ClassregRequests.getHomeworkList, request);
        }),
        getLessonTopicsMeta: http
          .requestSchema(ClassregRequests.getLessonTopicsMeta, undefined)
          .pipe(Effect.withSpan("ClassregClient.getLessonTopicsMeta")),
      });
    }),
  );
}

export type { ClassregHomeworkListRequest } from "./requests.ts";
