import { Effect, Layer, Redacted } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientError from "effect/unstable/http/HttpClientError";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import type * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import { Live as AuthClientLive } from "../../src/core/auth.ts";
import { Live as BootstrapLive } from "../../src/core/bootstrap.ts";
import { layer as clientConfigLayer } from "../../src/core/config.ts";
import type { ClientConfig } from "../../src/core/config.ts";
import { Live as SchoolDiscoveryLive } from "../../src/core/discovery.ts";
import { Live as WebUntisHttpLive } from "../../src/core/http.ts";
import { Live as WebUntisClientLive } from "../../src/client.ts";

export const testConfig: ClientConfig = {
  schoolName: "IGS Lilienthal",
  schoolLoginName: "igs-lilienthal",
  serverUrl: "https://igs-lilienthal.webuntis.com/WebUntis/?school=igs-lilienthal",
  username: "tester",
  password: Redacted.make("secret")
};

export const makeJwt = (expSecondsFromNow = 3_600) => {
  const header = "eyJhbGciOiJub25lIn0";
  const payload = btoa(JSON.stringify({
    exp: Math.floor(Date.now() / 1_000) + expSecondsFromNow
  })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

  return `${header}.${payload}.signature`;
};

export const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {})
    },
    ...init
  });

export const makeMockHttpClient = (
  handler: (request: HttpClientRequest.HttpClientRequest) => Response | Promise<Response>
) =>
  HttpClient.make((request) =>
    Effect.tryPromise({
      try: async () => HttpClientResponse.fromWeb(request, await handler(request)),
      catch: (cause) =>
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.TransportError({
            request,
            cause
          })
        })
    })
  );

export const makeCoreTestLayer = (
  handler: Parameters<typeof makeMockHttpClient>[0],
  config: ClientConfig = testConfig
) => {
  const baseLayer = Layer.mergeAll(
    clientConfigLayer(config),
    Layer.succeed(HttpClient.HttpClient, makeMockHttpClient(handler))
  );
  const discoveryLayer = SchoolDiscoveryLive.pipe(
    Layer.provideMerge(baseLayer)
  );
  const bootstrapLayer = BootstrapLive.pipe(
    Layer.provideMerge(discoveryLayer)
  );
  const authLayer = AuthClientLive.pipe(
    Layer.provideMerge(bootstrapLayer)
  );
  const httpLayer = WebUntisHttpLive.pipe(
    Layer.provideMerge(bootstrapLayer)
  );
  const clientLayer = WebUntisClientLive.pipe(
    Layer.provideMerge(Layer.mergeAll(authLayer, httpLayer))
  );

  return Layer.mergeAll(bootstrapLayer, authLayer, httpLayer, clientLayer);
};
