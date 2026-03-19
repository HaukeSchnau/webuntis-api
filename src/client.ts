import { Effect, Layer, ServiceMap } from "effect";
import type * as Fx from "effect/Effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { AuthClient, Live as AuthClientLive } from "./core/auth.ts";
import { Bootstrap, Live as BootstrapLive } from "./core/bootstrap.ts";
import { type ClientConfig as ClientConfigShape, layer as clientConfigLayer } from "./core/config.ts";
import { SchoolDiscovery, Live as SchoolDiscoveryLive } from "./core/discovery.ts";
import { WebUntisHttp, Live as WebUntisHttpLive } from "./core/http.ts";
import { makeAppClient } from "./domains/app.ts";
import { makeCalendarEntryClient } from "./domains/calendar-entry.ts";
import { makeClassregClient } from "./domains/classreg.ts";
import { makeExamsClient } from "./domains/exams.ts";
import { makeMessagesClient } from "./domains/messages.ts";
import { makeProfileClient } from "./domains/profile.ts";
import { makeRawViewApiClient } from "./domains/raw-view-api.ts";
import { makeSchoolyearsClient } from "./domains/schoolyears.ts";
import { makeSessionClient } from "./domains/session.ts";
import { makeTimetableClient } from "./domains/timetable.ts";

export interface WebUntisClient {
  readonly auth: AuthClient;
  readonly app: Fx.Success<typeof makeAppClient>;
  readonly classreg: Fx.Success<typeof makeClassregClient>;
  readonly exams: Fx.Success<typeof makeExamsClient>;
  readonly schoolyears: Fx.Success<typeof makeSchoolyearsClient>;
  readonly messages: Fx.Success<typeof makeMessagesClient>;
  readonly profile: Fx.Success<typeof makeProfileClient>;
  readonly session: Fx.Success<typeof makeSessionClient>;
  readonly timetable: Fx.Success<typeof makeTimetableClient>;
  readonly rawViewApi: Fx.Success<typeof makeRawViewApiClient>;
  readonly experimental: {
    readonly calendarEntry: Fx.Success<typeof makeCalendarEntryClient>;
    readonly profile: Fx.Success<typeof makeProfileClient>["experimental"];
    readonly timetable: Fx.Success<typeof makeTimetableClient>["experimental"];
    readonly rawViewApi: Fx.Success<typeof makeRawViewApiClient>;
  };
}

export const WebUntisClient = ServiceMap.Service<WebUntisClient, WebUntisClient>("webuntis/WebUntisClient");

export const makeWebUntisClient = Effect.gen(function*() {
  const auth = yield* AuthClient;
  const app = yield* makeAppClient;
  const calendarEntry = yield* makeCalendarEntryClient;
  const classreg = yield* makeClassregClient;
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
    classreg,
    exams,
    schoolyears,
    messages,
    profile,
    session,
    timetable,
    rawViewApi,
    experimental: {
      calendarEntry,
      profile: profile.experimental,
      timetable: timetable.experimental,
      rawViewApi
    }
  } satisfies WebUntisClient;
});

export const Live = Layer.effect(WebUntisClient, makeWebUntisClient);

export const layer = (config: ClientConfigShape) => {
  const configLayer = clientConfigLayer(config);
  const transportLayer = Layer.mergeAll(configLayer, FetchHttpClient.layer);
  const discoveryLayer = SchoolDiscoveryLive.pipe(Layer.provideMerge(transportLayer));
  const bootstrapLayer = BootstrapLive.pipe(Layer.provideMerge(discoveryLayer));
  const authLayer = AuthClientLive.pipe(Layer.provideMerge(bootstrapLayer));
  const httpLayer = WebUntisHttpLive.pipe(Layer.provideMerge(bootstrapLayer));

  return Live.pipe(
    Layer.provideMerge(Layer.mergeAll(authLayer, httpLayer))
  );
};
