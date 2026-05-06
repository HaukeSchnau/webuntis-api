import { Context, Effect, Layer } from "effect";
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
import { makeWebUntisCoreLayer } from "./internal/runtime.ts";

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

export class WebUntisClient extends Context.Service<WebUntisClient, WebUntisClientShape>()(
  "webuntis/WebUntisClient",
) {
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
  const coreLayer = makeWebUntisCoreLayer({ config, transportLayer });

  const domainServicesLayer = Layer.mergeAll(
    AuthClient.layerNoDeps.pipe(Layer.provide(coreLayer)),
    AppClient.layerNoDeps.pipe(Layer.provide(coreLayer)),
    ClassregClient.layerNoDeps.pipe(Layer.provide(coreLayer)),
    ExamsClient.layerNoDeps.pipe(Layer.provide(coreLayer)),
    MessagesClient.layerNoDeps.pipe(Layer.provide(coreLayer)),
    ProfileClient.layerNoDeps.pipe(Layer.provide(coreLayer)),
    SchoolyearsClient.layerNoDeps.pipe(Layer.provide(coreLayer)),
    SessionClient.layerNoDeps.pipe(Layer.provide(coreLayer)),
    TimetableClient.layerNoDeps.pipe(Layer.provide(coreLayer)),
  );

  const aggregateLayer = WebUntisClient.layerNoDeps.pipe(Layer.provide(domainServicesLayer));

  return Layer.mergeAll(domainServicesLayer, aggregateLayer);
};

export const layer = makeWebUntisLayer;
