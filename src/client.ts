import { Effect, Layer, ServiceMap } from "effect";
import type * as Fx from "effect/Effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { AuthClient, Live as AuthClientLive } from "./core/auth.ts";
import { ClientConfig, type ClientConfig as ClientConfigShape } from "./core/config.ts";
import { SchoolDiscovery, Live as SchoolDiscoveryLive } from "./core/discovery.ts";
import { SessionStore, inMemory as SessionStoreInMemory } from "./core/session-store.ts";
import { WebUntisHttp, Live as WebUntisHttpLive } from "./core/http.ts";
import { makeAppClient } from "./domains/app.ts";
import { makeExamsClient } from "./domains/exams.ts";
import { makeMessagesClient } from "./domains/messages.ts";
import { makeProfileClient } from "./domains/profile.ts";
import { makeRawViewApiClient } from "./domains/raw-view-api.ts";
import { makeSchoolyearsClient } from "./domains/schoolyears.ts";
import { makeSessionClient } from "./domains/session.ts";
import { makeTimetableClient } from "./domains/timetable.ts";

export interface WebUntisClient {
  readonly auth: {
    readonly ensureAuthenticated: Fx.Effect<any, unknown>;
    readonly refreshToken: Fx.Effect<string, unknown>;
    readonly clear: Fx.Effect<void, unknown>;
  };
  readonly app: Fx.Success<typeof makeAppClient>;
  readonly exams: Fx.Success<typeof makeExamsClient>;
  readonly schoolyears: Fx.Success<typeof makeSchoolyearsClient>;
  readonly messages: Fx.Success<typeof makeMessagesClient>;
  readonly profile: Fx.Success<typeof makeProfileClient>;
  readonly session: Fx.Success<typeof makeSessionClient>;
  readonly timetable: Fx.Success<typeof makeTimetableClient>;
  readonly rawViewApi: Fx.Success<typeof makeRawViewApiClient>;
}

export const WebUntisClient = ServiceMap.Service<WebUntisClient, WebUntisClient>("webuntis/WebUntisClient");

export const Live = Layer.effect(WebUntisClient)(
  Effect.gen(function*() {
    const auth = yield* AuthClient;
    const app = yield* makeAppClient;
    const exams = yield* makeExamsClient;
    const schoolyears = yield* makeSchoolyearsClient;
    const messages = yield* makeMessagesClient;
    const profile = yield* makeProfileClient;
    const session = yield* makeSessionClient;
    const timetable = yield* makeTimetableClient;
    const rawViewApi = yield* makeRawViewApiClient;

    return {
      auth,
      app,
      exams,
      schoolyears,
      messages,
      profile,
      session,
      timetable,
      rawViewApi
    };
  })
);

export const layer = (config: ClientConfigShape) => {
  const configLayer = Layer.succeed(ClientConfig)(config);
  const baseLayer = Layer.mergeAll(
    configLayer,
    FetchHttpClient.layer,
    SessionStoreInMemory
  );
  const schoolDiscoveryLayer = SchoolDiscoveryLive.pipe(
    Layer.provideMerge(baseLayer)
  );
  const authLayer = AuthClientLive.pipe(
    Layer.provideMerge(schoolDiscoveryLayer)
  );
  const webUntisHttpLayer = Layer.effect(WebUntisHttp)(WebUntisHttpLive).pipe(
    Layer.provideMerge(authLayer)
  );
  return Live.pipe(
    Layer.provideMerge(webUntisHttpLayer)
  );
};
