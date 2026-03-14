import { Effect, Redacted, Schema, ServiceMap } from "effect";
import * as Cookies from "effect/unstable/http/Cookies";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import { AuthClient } from "./auth.ts";
import { SchemaDriftError, UnexpectedResponseError } from "./errors.ts";
import { strictJsonParseOptions } from "./schema.ts";
import { SessionStore } from "./session-store.ts";
import { resolveBaseUrl } from "./types.ts";

const defaultAcceptHeader = "application/json, text/plain, */*";

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
  readonly get: (path: string, options?: RequestOptions) => Effect.Effect<HttpClientResponse.HttpClientResponse, unknown>;
  readonly getJson: (path: string, options?: RequestOptions) => Effect.Effect<unknown, unknown>;
  readonly getSchema: <S extends Schema.Top>(
    path: string,
    schema: S,
    options?: RequestOptions
  ) => Effect.Effect<Schema.Schema.Type<S>, unknown, S["DecodingServices"]>;
  readonly post: (path: string, options?: RequestOptions) => Effect.Effect<HttpClientResponse.HttpClientResponse, unknown>;
  readonly postJson: (path: string, options?: RequestOptions) => Effect.Effect<unknown, unknown>;
  readonly postSchema: <S extends Schema.Top>(
    path: string,
    schema: S,
    options?: RequestOptions
  ) => Effect.Effect<Schema.Schema.Type<S>, unknown, S["DecodingServices"]>;
  readonly put: (path: string, options?: RequestOptions) => Effect.Effect<HttpClientResponse.HttpClientResponse, unknown>;
  readonly putJson: (path: string, options?: RequestOptions) => Effect.Effect<unknown, unknown>;
  readonly putSchema: <S extends Schema.Top>(
    path: string,
    schema: S,
    options?: RequestOptions
  ) => Effect.Effect<Schema.Schema.Type<S>, unknown, S["DecodingServices"]>;
}

export const WebUntisHttp = ServiceMap.Service<WebUntisHttp, WebUntisHttp>("webuntis/WebUntisHttp");

export const Live = Effect.gen(function*() {
  const baseClient = yield* HttpClient.HttpClient;
  const authClient = yield* AuthClient;
  const sessionStore = yield* SessionStore;

  const execute = (method: "GET" | "POST" | "PUT", path: string, options: RequestOptions = {}) =>
    Effect.gen(function*() {
      const state = yield* authClient.ensureAuthenticated;
      const school = state.resolvedSchool!;
      const token = state.token ? Redacted.value(state.token) : undefined;
      const cookieHeader = Object.values(state.cookies.cookies).map((cookie) => `${cookie.name}=${cookie.valueEncoded}`).join("; ");
      const baseUrl = resolveBaseUrl(school);
      const isAbsolute = /^https?:\/\//.test(path);
      const baseHeaders: Record<string, string> = {
        accept: defaultAcceptHeader
      };

      if (token) {
        baseHeaders.Authorization = `Bearer ${token}`;
      }
      if (cookieHeader.length > 0) {
        baseHeaders.cookie = cookieHeader;
      }
      if (state.tenantId) {
        baseHeaders["Tenant-Id"] = state.tenantId;
      }
      if (options.withSchoolYearHeader !== false && state.schoolYearId !== undefined) {
        baseHeaders["X-Webuntis-Api-School-Year-Id"] = String(state.schoolYearId);
      }

      let request = HttpClientRequest.make(method)(isAbsolute ? path : `${baseUrl}/${path.replace(/^\/+/, "")}`).pipe(
        HttpClientRequest.setUrlParams(options.query ?? {}),
        HttpClientRequest.setHeaders(mergeHeaders(baseHeaders, options.headers))
      );

      if (method !== "GET" && options.body !== undefined) {
        request = yield* HttpClientRequest.bodyJson(request, options.body);
      }

      const response = yield* baseClient.execute(request);
      yield* sessionStore.update((current) => ({
        ...current,
        cookies: Cookies.merge(current.cookies, response.cookies)
      }));

      if (response.status < 200 || response.status >= 300) {
        return yield* Effect.fail(
          new UnexpectedResponseError({
            path,
            status: response.status,
            body: yield* response.text
          })
        );
      }

      return response;
    });

  const decodeSchema = <S extends Schema.Top>(
    path: string,
    schema: S,
    effect: Effect.Effect<HttpClientResponse.HttpClientResponse, unknown>
  ) =>
    effect.pipe(
      Effect.flatMap(HttpClientResponse.schemaBodyJson(schema as any, strictJsonParseOptions)),
      Effect.mapError((error) =>
        error instanceof UnexpectedResponseError
          ? error
          : new SchemaDriftError({
            path,
            message: String(error)
          }))
    ) as Effect.Effect<Schema.Schema.Type<S>, unknown, S["DecodingServices"]>;

  const get: WebUntisHttp["get"] = (path, options) => execute("GET", path, options);
  const getJson: WebUntisHttp["getJson"] = (path, options) =>
    get(path, options).pipe(Effect.flatMap((response) => response.json));
  const getSchema: WebUntisHttp["getSchema"] = (path, schema, options) =>
    decodeSchema(path, schema, get(path, options));

  const post: WebUntisHttp["post"] = (path, options) => execute("POST", path, options);
  const postJson: WebUntisHttp["postJson"] = (path, options) =>
    post(path, options).pipe(Effect.flatMap((response) => response.json));
  const postSchema: WebUntisHttp["postSchema"] = (path, schema, options) =>
    decodeSchema(path, schema, post(path, options));

  const put: WebUntisHttp["put"] = (path, options) => execute("PUT", path, options);
  const putJson: WebUntisHttp["putJson"] = (path, options) =>
    put(path, options).pipe(Effect.flatMap((response) => response.json));
  const putSchema: WebUntisHttp["putSchema"] = (path, schema, options) =>
    decodeSchema(path, schema, put(path, options));

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
  };
});
