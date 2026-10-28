import { Effect, Layer, Redacted, type Schema } from "effect";
import {
  HttpClient,
  HttpClientError,
  type HttpClientRequest,
  HttpClientResponse,
} from "effect/http";
import { makeWebUntisResearchLayer } from "../../src/client.ts";
import {
  Credential,
  type SchoolTarget,
  type WebUntisConnection,
} from "../../src/internal/connection.ts";
import type { WebUntisError } from "../../src/internal/errors.ts";
import type { WebUntisHttp } from "../../src/internal/http.ts";
import {
  type HeaderParams,
  type QueryParams,
  request,
  RequestPolicy,
  schemaRequest,
} from "../../src/internal/request.ts";

export const testSchoolTarget: SchoolTarget = {
  loginName: "igs-lilienthal",
  serverUrl: "https://igs-lilienthal.webuntis.com/WebUntis/?school=igs-lilienthal",
};

export const testConnection: WebUntisConnection = {
  school: testSchoolTarget,
  credential: Credential.Password({ username: "tester", password: Redacted.make("secret") }),
};

const encodeJwt = (payloadValue: object) => {
  const header = "eyJhbGciOiJub25lIn0";
  const payload = btoa(JSON.stringify(payloadValue))
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(/=+$/gu, "");

  return `${header}.${payload}.signature`;
};

/** Unsigned JWT that expires `expSecondsFromNow` seconds from now. */
export const makeJwt = (expSecondsFromNow = 3_600) =>
  encodeJwt({ exp: Math.floor(Date.now() / 1_000) + expSecondsFromNow });

/** Unsigned JWT with no `exp` claim, so the caller must fall back to a default. */
export const makeJwtWithoutExpiry = () => encodeJwt({});

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

/** A mock `HttpClient` as a layer, for code that takes the client from context. */
export const mockHttpLayer = (handler: Parameters<typeof makeMockHttpClient>[0]) =>
  Layer.succeed(HttpClient.HttpClient, makeMockHttpClient(handler));

export const makeCoreTestLayer = (
  handler: Parameters<typeof makeMockHttpClient>[0],
  connection: WebUntisConnection = testConnection,
) => makeWebUntisResearchLayer(connection).pipe(Layer.provide(mockHttpLayer(handler)));

interface TestGetOptions {
  readonly query?: QueryParams | undefined;
  readonly headers?: HeaderParams | undefined;
  readonly policy?: RequestPolicy | undefined;
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
): Effect.Effect<S["Type"], WebUntisError, S["DecodingServices"]> =>
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
