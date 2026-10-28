import { Context, Effect, Layer } from "effect";
import { AuthClient } from "./auth.ts";
import { AppClient } from "./domains/app/index.ts";
import { ClassregClient } from "./domains/classreg/index.ts";
import { ExamsClient } from "./domains/exams/index.ts";
import { MessagesClient } from "./domains/messages/index.ts";
import { ProfileClient } from "./domains/profile/index.ts";
import { SchoolyearsClient } from "./domains/schoolyears/index.ts";
import { SessionClient } from "./domains/session/index.ts";
import { TimetableClient } from "./domains/timetable/index.ts";
import type { WebUntisConnection } from "./internal/connection.ts";
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

const makeLayers = (connection: WebUntisConnection) => {
  const coreLayer = makeWebUntisCoreLayer(connection);

  const domainServicesLayer = Layer.mergeAll(
    AuthClient.layer,
    AppClient.layer,
    ClassregClient.layer,
    ExamsClient.layer,
    MessagesClient.layer,
    ProfileClient.layer,
    SchoolyearsClient.layer,
    SessionClient.layer,
    TimetableClient.layer,
  ).pipe(Layer.provide(coreLayer));

  const aggregateLayer = WebUntisClient.layer.pipe(Layer.provide(domainServicesLayer));

  return {
    coreLayer,
    publicLayer: Layer.mergeAll(domainServicesLayer, aggregateLayer),
  } as const;
};

/**
 * Every public service for one connection. Each call builds an independent
 * client with its own session, so several schools or accounts can run side by
 * side in one process. Building fails with `ConfigurationError` if a pinned
 * school's server URL is unusable.
 *
 * The layer needs an `HttpClient`. Provide `FetchHttpClient.layer` from
 * `effect/http`; logging in relies on fetch's `redirect: "manual"`.
 */
export const webUntisLayer = (connection: WebUntisConnection) =>
  // The service layers are module-level values that Effect memoizes by identity,
  // also across nested and `LayerMap` builds. A fresh memo map per connection
  // keeps a second connection from reusing the first one's session.
  Layer.fresh(makeLayers(connection).publicLayer);

/**
 * Internal composition used by tests and the reverse-engineering probes in
 * `test/live`. It additionally exposes the raw view client and the core runtime
 * services, neither of which is part of the published surface.
 */
export const makeWebUntisResearchLayer = (connection: WebUntisConnection) => {
  const layers = makeLayers(connection);
  const researchLayer = RawViewApiClient.layer.pipe(Layer.provide(layers.coreLayer));
  return Layer.fresh(Layer.mergeAll(layers.publicLayer, researchLayer, layers.coreLayer));
};
