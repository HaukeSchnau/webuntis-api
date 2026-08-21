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
import { ClientConfig } from "./internal/config.ts";
import { RawViewApiClient } from "./internal/raw-view-api.ts";
import { makeWebUntisCoreLayer } from "./internal/runtime.ts";

/**
 * Convenience aggregate over the focused domain services. Prefer depending on
 * the individual services directly; this exists for programs that genuinely
 * need most of the surface at once.
 */
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

const makeLayers = <ConfigError>(
  configLayer: Layer.Layer<ClientConfig, ConfigError>,
  transportLayer?: Layer.Layer<HttpClient.HttpClient>,
) => {
  const coreLayer = makeWebUntisCoreLayer({ configLayer, transportLayer });

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

/**
 * Every public service, built from an already-resolved configuration.
 *
 * Use {@link webUntisLayer} instead when the configuration should come from the
 * environment or from an installed `ConfigProvider`.
 */
export const makeWebUntisLayer = (
  config: ClientConfig["Service"],
  transportLayer?: Layer.Layer<HttpClient.HttpClient>,
) => makeLayers(ClientConfig.layer(config), transportLayer).publicLayer;

/**
 * Every public service, configured from the ambient `ConfigProvider` when the
 * layer is built. Fails with `ConfigurationError` if the `WEBUNTIS_*` settings
 * are missing or malformed.
 */
export const webUntisLayer = makeLayers(ClientConfig.Live).publicLayer;

/**
 * Internal composition used by the reverse-engineering probes in `test/live`.
 * It additionally exposes the raw view client and the core runtime services,
 * neither of which is part of the published surface.
 */
export const makeWebUntisResearchLayer = (
  config: ClientConfig["Service"],
  transportLayer?: Layer.Layer<HttpClient.HttpClient>,
) => {
  const layers = makeLayers(ClientConfig.layer(config), transportLayer);
  const researchLayer = RawViewApiClient.layer.pipe(Layer.provide(layers.coreLayer));
  return Layer.mergeAll(layers.publicLayer, researchLayer, layers.coreLayer);
};
