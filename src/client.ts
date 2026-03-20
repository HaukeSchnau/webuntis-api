import { Effect, Layer, ServiceMap } from "effect";
import type * as HttpClient from "effect/unstable/http/HttpClient";
import { AuthClient } from "./auth.ts";
import { AppClient } from "./domains/app/index.ts";
import { ClassregClient } from "./domains/classreg/index.ts";
import { ExamsClient } from "./domains/exams/index.ts";
import { MessagesClient } from "./domains/messages/index.ts";
import { ProfileClient } from "./domains/profile/index.ts";
import { SchoolyearsClient } from "./domains/schoolyears/index.ts";
import { SessionClient } from "./domains/session/index.ts";
import { TimetableClient } from "./domains/timetable/index.ts";
import type { ClientConfig } from "./internal/config.ts";
import { makeWebUntisRuntimeLayer } from "./internal/runtime.ts";

export interface WebUntisClientShape {
  readonly auth: AuthClient["Service"];
  readonly app: AppClient["Service"];
  readonly classreg: ClassregClient["Service"];
  readonly exams: ExamsClient["Service"];
  readonly schoolyears: SchoolyearsClient["Service"];
  readonly messages: MessagesClient["Service"];
  readonly profile: ProfileClient["Service"];
  readonly session: SessionClient["Service"];
  readonly timetable: TimetableClient["Service"];
}

export class WebUntisClient extends ServiceMap.Service<
  WebUntisClient,
  WebUntisClientShape
>()("webuntis/WebUntisClient") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const auth = yield* AuthClient;
      const app = yield* AppClient;
      const classreg = yield* ClassregClient;
      const exams = yield* ExamsClient;
      const schoolyears = yield* SchoolyearsClient;
      const messages = yield* MessagesClient;
      const profile = yield* ProfileClient;
      const session = yield* SessionClient;
      const timetable = yield* TimetableClient;

      return WebUntisClient.of({
        auth,
        app,
        classreg,
        exams,
        schoolyears,
        messages,
        profile,
        session,
        timetable,
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}

export const makeWebUntisLayer = (
  config: ClientConfig["Service"],
  transportLayer?: Layer.Layer<HttpClient.HttpClient>,
) => {
  const runtimeLayer = makeWebUntisRuntimeLayer({ config, transportLayer });
  const servicesLayer = Layer.mergeAll(
    AuthClient.layerNoDeps.pipe(Layer.provide(runtimeLayer)),
    AppClient.layerNoDeps.pipe(Layer.provide(runtimeLayer)),
    ClassregClient.layerNoDeps.pipe(Layer.provide(runtimeLayer)),
    ExamsClient.layerNoDeps.pipe(Layer.provide(runtimeLayer)),
    MessagesClient.layerNoDeps.pipe(Layer.provide(runtimeLayer)),
    ProfileClient.layerNoDeps.pipe(Layer.provide(runtimeLayer)),
    SchoolyearsClient.layerNoDeps.pipe(Layer.provide(runtimeLayer)),
    SessionClient.layerNoDeps.pipe(Layer.provide(runtimeLayer)),
    TimetableClient.layerNoDeps.pipe(Layer.provide(runtimeLayer)),
  );
  const clientLayer = WebUntisClient.layerNoDeps.pipe(
    Layer.provide(servicesLayer),
  );

  return Layer.mergeAll(servicesLayer, clientLayer);
};

export const layer = makeWebUntisLayer;
