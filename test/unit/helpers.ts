import { Effect, Layer, Redacted } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientError from "effect/unstable/http/HttpClientError";
import type * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import { makeWebUntisLayer } from "../../src/client.ts";
import type { ClientConfig } from "../../src/internal/config.ts";
import { makeWebUntisRuntimeLayer } from "../../src/internal/runtime.ts";

export const testConfig: ClientConfig["Service"] = {
  schoolName: "IGS Lilienthal",
  schoolLoginName: "igs-lilienthal",
  serverUrl:
    "https://igs-lilienthal.webuntis.com/WebUntis/?school=igs-lilienthal",
  username: "tester",
  password: Redacted.make("secret"),
};

export const makeJwt = (expSecondsFromNow: number | undefined = 3_600) => {
  const header = "eyJhbGciOiJub25lIn0";
  const payloadValue =
    expSecondsFromNow === undefined
      ? {}
      : {
          exp: Math.floor(Date.now() / 1_000) + expSecondsFromNow,
        };
  const payload = btoa(JSON.stringify(payloadValue))
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
  const transportLayer = Layer.succeed(
    HttpClient.HttpClient,
    makeMockHttpClient(handler),
  );
  const runtimeLayer = makeWebUntisRuntimeLayer({
    config,
    transportLayer,
  });
  const publicLayer = makeWebUntisLayer(config, transportLayer);

  return Layer.mergeAll(runtimeLayer, publicLayer);
};
