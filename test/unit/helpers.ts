import { Effect, Layer, Redacted } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientError from "effect/unstable/http/HttpClientError";
import type * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import { AuthClient } from "../../src/auth.ts";
import { WebUntisClient } from "../../src/client.ts";
import { AppClient } from "../../src/domains/app/index.ts";
import { ClassregClient } from "../../src/domains/classreg/index.ts";
import { ExamsClient } from "../../src/domains/exams/index.ts";
import { MessagesClient } from "../../src/domains/messages/index.ts";
import { ProfileClient } from "../../src/domains/profile/index.ts";
import { RawViewApiClient } from "../../src/domains/raw-view-api/index.ts";
import { SchoolyearsClient } from "../../src/domains/schoolyears/index.ts";
import { SessionClient } from "../../src/domains/session/index.ts";
import { TimetableClient } from "../../src/domains/timetable/index.ts";
import { Bootstrap } from "../../src/internal/bootstrap.ts";
import { ClientConfig } from "../../src/internal/config.ts";
import { SchoolDiscovery } from "../../src/internal/discovery.ts";
import { WebUntisHttp } from "../../src/internal/http.ts";

export const testConfig: ClientConfig["Service"] = {
  schoolName: "IGS Lilienthal",
  schoolLoginName: "igs-lilienthal",
  serverUrl:
    "https://igs-lilienthal.webuntis.com/WebUntis/?school=igs-lilienthal",
  username: "tester",
  password: Redacted.make("secret"),
};

export const makeJwt = (expSecondsFromNow = 3_600) => {
  const header = "eyJhbGciOiJub25lIn0";
  const payload = btoa(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1_000) + expSecondsFromNow,
    }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${payload}.signature`;
};

export const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });

export const makeMockHttpClient = (
  handler: (
    request: HttpClientRequest.HttpClientRequest,
  ) => Response | Promise<Response>,
) =>
  HttpClient.make((request) =>
    Effect.tryPromise({
      try: async () =>
        HttpClientResponse.fromWeb(request, await handler(request)),
      catch: (cause) =>
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.TransportError({
            request,
            cause,
          }),
        }),
    }),
  );

export const makeCoreTestLayer = (
  handler: Parameters<typeof makeMockHttpClient>[0],
  config: ClientConfig["Service"] = testConfig,
) => {
  const baseLayer = Layer.mergeAll(
    ClientConfig.layer(config),
    Layer.succeed(HttpClient.HttpClient, makeMockHttpClient(handler)),
  );
  const discoveryLayer = SchoolDiscovery.layerNoDeps.pipe(
    Layer.provideMerge(baseLayer),
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
  const messagesLayer = MessagesClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const profileLayer = ProfileClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const rawViewApiLayer = RawViewApiClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const schoolyearsLayer = SchoolyearsClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const sessionLayer = SessionClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const timetableLayer = TimetableClient.layerNoDeps.pipe(
    Layer.provideMerge(httpLayer),
  );
  const clientLayer = WebUntisClient.layerNoDeps.pipe(
    Layer.provideMerge(
      Layer.mergeAll(
        authLayer,
        appLayer,
        classregLayer,
        examsLayer,
        messagesLayer,
        profileLayer,
        schoolyearsLayer,
        sessionLayer,
        timetableLayer,
      ),
    ),
  );

  return Layer.mergeAll(
    discoveryLayer,
    bootstrapLayer,
    authLayer,
    httpLayer,
    rawViewApiLayer,
    appLayer,
    classregLayer,
    examsLayer,
    messagesLayer,
    profileLayer,
    schoolyearsLayer,
    sessionLayer,
    timetableLayer,
    clientLayer,
  );
};
