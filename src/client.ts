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
import { RawViewApiClient } from "./internal/raw-view-api.ts";
import { makeWebUntisCoreLayer } from "./internal/runtime.ts";
import { type SchoolYearScope, withSchoolYear } from "./internal/school-year-context.ts";

export interface WebUntisClientShape {
  readonly withSchoolYear: (schoolYearId: number) => SchoolYearScope;
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
  static readonly layer = Layer.effect(
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
        withSchoolYear,
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
}

const makeLayers = (
  config: ClientConfig["Service"],
  transportLayer?: Layer.Layer<HttpClient.HttpClient>,
) => {
  const coreLayer = makeWebUntisCoreLayer({ config, transportLayer });

  const domainServicesLayer = Layer.mergeAll(
    AuthClient.layer.pipe(Layer.provide(coreLayer)),
    AppClient.layer.pipe(Layer.provide(coreLayer)),
    ClassregClient.layer.pipe(Layer.provide(coreLayer)),
    ExamsClient.layer.pipe(Layer.provide(coreLayer)),
    MessagesClient.layer.pipe(Layer.provide(coreLayer)),
    ProfileClient.layer.pipe(Layer.provide(coreLayer)),
    SchoolyearsClient.layer.pipe(Layer.provide(coreLayer)),
    SessionClient.layer.pipe(Layer.provide(coreLayer)),
    TimetableClient.layer.pipe(Layer.provide(coreLayer)),
  );

  const aggregateLayer = WebUntisClient.layer.pipe(Layer.provide(domainServicesLayer));

  return {
    coreLayer,
    publicLayer: Layer.mergeAll(domainServicesLayer, aggregateLayer),
  } as const;
};

export const makeWebUntisLayer = (
  config: ClientConfig["Service"],
  transportLayer?: Layer.Layer<HttpClient.HttpClient>,
) => makeLayers(config, transportLayer).publicLayer;

export const makeWebUntisResearchLayer = (
  config: ClientConfig["Service"],
  transportLayer?: Layer.Layer<HttpClient.HttpClient>,
) => {
  const layers = makeLayers(config, transportLayer);
  const researchLayer = RawViewApiClient.layer.pipe(Layer.provide(layers.coreLayer));
  return Layer.mergeAll(layers.publicLayer, researchLayer, layers.coreLayer);
};
