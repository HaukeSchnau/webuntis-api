import { Effect, Layer, Redacted, type Schema } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientError from "effect/unstable/http/HttpClientError";
import type * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import { makeWebUntisResearchLayer } from "../../src/client.ts";
import type { ClientConfig } from "../../src/internal/config.ts";
import type { RequestFailure, WebUntisHttp } from "../../src/internal/http.ts";
import {
  type HeaderParams,
  type QueryParams,
  request,
  RequestPolicy,
  type RequestPolicy as RequestPolicyType,
  schemaRequest,
} from "../../src/internal/request.ts";

export const testConfig: ClientConfig["Service"] = {
  schoolName: "IGS Lilienthal",
  schoolLoginName: "igs-lilienthal",
  serverUrl: "https://igs-lilienthal.webuntis.com/WebUntis/?school=igs-lilienthal",
  username: "tester",
  password: Redacted.make("secret"),
};

export const makeJwt = (...args: [] | [expSecondsFromNow: number | undefined]) => {
  const expSecondsFromNow = args.length === 0 ? 3_600 : args[0];
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

export const jsonResponse = (body: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    status: 200,
    headers,
  });
};

export const makeMockHttpClient = (
  handler: (request: HttpClientRequest.HttpClientRequest) => Response | Promise<Response>,
) =>
  HttpClient.make((request) =>
    Effect.tryPromise({
      try: async () => HttpClientResponse.fromWeb(request, await handler(request)),
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
  const transportLayer = Layer.succeed(HttpClient.HttpClient, makeMockHttpClient(handler));
  return makeWebUntisResearchLayer(config, transportLayer);
};

interface TestGetOptions {
  readonly query?: QueryParams | undefined;
  readonly headers?: HeaderParams | undefined;
  readonly policy?: RequestPolicyType | undefined;
  readonly supportsSchoolYearScope?: boolean | undefined;
}

export const testGet = (
  http: WebUntisHttp["Service"],
  path: string,
  options: TestGetOptions = {},
) =>
  http.request(
    request<void>({
      method: "GET",
      path,
      policy: options.policy ?? RequestPolicy.Metadata,
      query: () => options.query ?? {},
      headers: () => options.headers ?? {},
      supportsSchoolYearScope: options.supportsSchoolYearScope,
    }),
    undefined,
  );

export const testGetSchema = <S extends Schema.Top>(
  http: WebUntisHttp["Service"],
  path: string,
  schema: S,
  options: TestGetOptions = {},
): Effect.Effect<Schema.Schema.Type<S>, RequestFailure, S["DecodingServices"]> =>
  http.requestSchema(
    schemaRequest<void, S>({
      method: "GET",
      path,
      policy: options.policy ?? RequestPolicy.Metadata,
      query: () => options.query ?? {},
      headers: () => options.headers ?? {},
      supportsSchoolYearScope: options.supportsSchoolYearScope,
      schema,
    }),
    undefined,
  );
