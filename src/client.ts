import { Effect, Layer, ServiceMap } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { AuthClient } from "./auth.ts";
import { AppClient } from "./domains/app/index.ts";
import { ClassregClient } from "./domains/classreg/index.ts";
import { ExamsClient } from "./domains/exams/index.ts";
import { MessagesClient } from "./domains/messages/index.ts";
import { ProfileClient } from "./domains/profile/index.ts";
import { RawViewApiClient } from "./domains/raw-view-api/index.ts";
import { SchoolyearsClient } from "./domains/schoolyears/index.ts";
import { SessionClient } from "./domains/session/index.ts";
import { TimetableClient } from "./domains/timetable/index.ts";
import { Bootstrap } from "./internal/bootstrap.ts";
import { ClientConfig } from "./internal/config.ts";
import { SchoolDiscovery } from "./internal/discovery.ts";
import { WebUntisHttp } from "./internal/http.ts";

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

export const makeWebUntisLayer = (config: ClientConfig["Service"]) => {
  const configLayer = ClientConfig.layer(config);
  const transportLayer = Layer.mergeAll(configLayer, FetchHttpClient.layer);
  const discoveryLayer = SchoolDiscovery.layerNoDeps.pipe(
    Layer.provideMerge(transportLayer),
  );
  const bootstrapLayer = Bootstrap.layerNoDeps.pipe(
    Layer.provideMerge(discoveryLayer),
  );
  const authLayer = AuthClient.layerNoDeps.pipe(
    Layer.provideMerge(bootstrapLayer),
  );
  const httpLayer = WebUntisHttp.layerNoDeps.pipe(
    Layer.provideMerge(bootstrapLayer),
  );
  const appLayer = AppClient.layerNoDeps.pipe(Layer.provideMerge(httpLayer));
  const classregLayer = ClassregClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const examsLayer = ExamsClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const rawViewApiLayer = RawViewApiClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const schoolyearsLayer = SchoolyearsClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const messagesLayer = MessagesClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const profileLayer = ProfileClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const sessionLayer = SessionClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const timetableLayer = TimetableClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const servicesLayer = Layer.mergeAll(
    authLayer,
    appLayer,
    classregLayer,
    examsLayer,
    rawViewApiLayer,
    schoolyearsLayer,
    messagesLayer,
    profileLayer,
    sessionLayer,
    timetableLayer,
  );
  const clientLayer = WebUntisClient.layerNoDeps.pipe(
    Layer.provideMerge(servicesLayer),
  );

  return Layer.mergeAll(
    discoveryLayer,
    bootstrapLayer,
    httpLayer,
    rawViewApiLayer,
    servicesLayer,
    clientLayer,
  );
};

export const layer = makeWebUntisLayer;
export const Live = WebUntisClient.layerNoDeps;
