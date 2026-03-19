import { Effect, Layer, Schema, ServiceMap } from "effect";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import { Bootstrap } from "./bootstrap.ts";
import { decodeError, type DecodeError, type DiscoveryError, type AuthError, TransportError, type TransportError as TransportErrorType } from "./errors.ts";
import { strictJsonParseOptions } from "./schema.ts";
import { resolveBaseUrl } from "./types.ts";

const defaultAcceptHeader = "application/json, text/plain, */*";

export type RequestFailure =
  | DiscoveryError
  | AuthError
  | TransportErrorType
  | DecodeError;

const mergeHeaders = (
  current: Readonly<Record<string, string>>,
  extra: Readonly<Record<string, string | undefined>> = {}
) =>
  Object.fromEntries(
    Object.entries({ ...current, ...extra }).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );

export interface RequestOptions {
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly headers?: Readonly<Record<string, string | undefined>>;
  readonly withSchoolYearHeader?: boolean | undefined;
  readonly body?: unknown;
}

export interface WebUntisHttp {
  readonly get: (path: string, options?: RequestOptions) => Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>;
  readonly getJson: (path: string, options?: RequestOptions) => Effect.Effect<unknown, RequestFailure>;
  readonly getSchema: <S extends Schema.Top>(
    path: string,
    schema: S,
    options?: RequestOptions
  ) => Effect.Effect<Schema.Schema.Type<S>, RequestFailure, S["DecodingServices"]>;
  readonly post: (path: string, options?: RequestOptions) => Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>;
  readonly postJson: (path: string, options?: RequestOptions) => Effect.Effect<unknown, RequestFailure>;
  readonly postSchema: <S extends Schema.Top>(
    path: string,
    schema: S,
    options?: RequestOptions
  ) => Effect.Effect<Schema.Schema.Type<S>, RequestFailure, S["DecodingServices"]>;
  readonly put: (path: string, options?: RequestOptions) => Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>;
  readonly putJson: (path: string, options?: RequestOptions) => Effect.Effect<unknown, RequestFailure>;
  readonly putSchema: <S extends Schema.Top>(
    path: string,
    schema: S,
    options?: RequestOptions
  ) => Effect.Effect<Schema.Schema.Type<S>, RequestFailure, S["DecodingServices"]>;
}

export const WebUntisHttp = ServiceMap.Service<WebUntisHttp, WebUntisHttp>("webuntis/WebUntisHttp");

export const makeWebUntisHttp = Effect.gen(function*() {
  const bootstrap = yield* Bootstrap;

  const execute = (
    method: "GET" | "POST" | "PUT",
    path: string,
    options: RequestOptions = {}
  ): Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure> =>
    Effect.gen(function*() {
      const state = yield* (options.withSchoolYearHeader === false
        ? bootstrap.ensureAuthenticated
        : bootstrap.ensureMetadata);
      const baseHeaders: Record<string, string> = {
        accept: defaultAcceptHeader
      };
      const isAbsolute = /^https?:\/\//.test(path);
      const url = isAbsolute ? path : `${resolveBaseUrl(state.resolvedSchool)}/${path.replace(/^\/+/, "")}`;

      let request = HttpClientRequest.make(method)(url).pipe(
        HttpClientRequest.setUrlParams(options.query ?? {}),
        HttpClientRequest.setHeaders(mergeHeaders(baseHeaders, options.headers)),
        HttpClientRequest.bearerToken(state.token)
      );

      if (state.tenantId) {
        request = HttpClientRequest.setHeader(request, "Tenant-Id", state.tenantId);
      }
      if (options.withSchoolYearHeader !== false && state.schoolYearId !== undefined) {
        request = HttpClientRequest.setHeader(request, "X-Webuntis-Api-School-Year-Id", String(state.schoolYearId));
      }
      if (method !== "GET" && options.body !== undefined) {
        request = yield* HttpClientRequest.bodyJson(request, options.body).pipe(
          Effect.mapError((error) =>
            new TransportError({
              method,
              path,
              message: String(error)
            }))
        );
      }

      const response = yield* bootstrap.client.execute(request).pipe(
        Effect.mapError((error) =>
          new TransportError({
            method,
            path,
            message: String(error)
          }))
      );

      if (response.status < 200 || response.status >= 300) {
        const body = yield* response.text.pipe(
          Effect.catch(() => Effect.succeed(""))
        );

        return yield* Effect.fail(
          new TransportError({
            method,
            path,
            status: response.status,
            body,
            message: `HTTP ${response.status} for ${method} ${path}`
          })
        );
      }

      return response;
    });

  const decodeSchema = <S extends Schema.Top>(
    path: string,
    schema: S,
    effect: Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>
  ) =>
    effect.pipe(
      Effect.flatMap((response) =>
        HttpClientResponse.schemaBodyJson(schema as S, strictJsonParseOptions)(response).pipe(
          Effect.mapError((error) =>
            error instanceof TransportError
              ? error
              : decodeError(path, error))
        ))
    ) as Effect.Effect<Schema.Schema.Type<S>, RequestFailure, S["DecodingServices"]>;

  const decodeJson = (path: string, effect: Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>) =>
    effect.pipe(
      Effect.flatMap((response) =>
        response.json.pipe(
          Effect.mapError((error) => decodeError(path, error))
        ))
    );

  const get: WebUntisHttp["get"] = (path, options) => execute("GET", path, options);
  const getJson: WebUntisHttp["getJson"] = (path, options) => decodeJson(path, get(path, options));
  const getSchema: WebUntisHttp["getSchema"] = (path, schema, options) => decodeSchema(path, schema, get(path, options));

  const post: WebUntisHttp["post"] = (path, options) => execute("POST", path, options);
  const postJson: WebUntisHttp["postJson"] = (path, options) => decodeJson(path, post(path, options));
  const postSchema: WebUntisHttp["postSchema"] = (path, schema, options) => decodeSchema(path, schema, post(path, options));

  const put: WebUntisHttp["put"] = (path, options) => execute("PUT", path, options);
  const putJson: WebUntisHttp["putJson"] = (path, options) => decodeJson(path, put(path, options));
  const putSchema: WebUntisHttp["putSchema"] = (path, schema, options) => decodeSchema(path, schema, put(path, options));

  return {
    get,
    getJson,
    getSchema,
    post,
    postJson,
    postSchema,
    put,
    putJson,
    putSchema
  } satisfies WebUntisHttp;
});

export const Live = Layer.effect(WebUntisHttp, makeWebUntisHttp);
