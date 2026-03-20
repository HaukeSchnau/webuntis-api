import { Effect, Layer, type Schema, ServiceMap } from "effect";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import { Bootstrap } from "./bootstrap.ts";
import {
  type AuthError,
  type DecodeError,
  type DiscoveryError,
  decodeError,
  TransportError,
  type TransportError as TransportErrorType,
} from "./errors.ts";
import {
  type RequestDescriptor,
  RequestPolicy,
  type RequestPolicy as RequestPolicyType,
  type SchemaRequestDescriptor,
} from "./request.ts";
import { strictJsonParseOptions } from "./schema.ts";
import { resolveBaseUrl } from "./types.ts";

const defaultAcceptHeader = "application/json, text/plain, */*";

export type RequestFailure =
  | DiscoveryError
  | AuthError
  | TransportErrorType
  | DecodeError;

export interface RequestOptions {
  readonly query?: Readonly<
    Record<string, string | number | boolean | undefined>
  >;
  readonly headers?: Readonly<Record<string, string | undefined>>;
  readonly policy?: RequestPolicyType | undefined;
  readonly body?: unknown;
}

const mergeHeaders = (
  current: Readonly<Record<string, string>>,
  extra: Readonly<Record<string, string | undefined>> = {},
) =>
  Object.fromEntries(
    Object.entries({ ...current, ...extra }).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );

export interface WebUntisHttpShape {
  readonly execute: (
    method: "GET" | "POST" | "PUT",
    path: string,
    options?: RequestOptions,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>;
  readonly get: (
    path: string,
    options?: RequestOptions,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>;
  readonly getJson: (
    path: string,
    options?: RequestOptions,
  ) => Effect.Effect<unknown, RequestFailure>;
  readonly getSchema: <S extends Schema.Top>(
    path: string,
    schema: S,
    options?: RequestOptions,
  ) => Effect.Effect<
    Schema.Schema.Type<S>,
    RequestFailure,
    S["DecodingServices"]
  >;
  readonly post: (
    path: string,
    options?: RequestOptions,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>;
  readonly postJson: (
    path: string,
    options?: RequestOptions,
  ) => Effect.Effect<unknown, RequestFailure>;
  readonly postSchema: <S extends Schema.Top>(
    path: string,
    schema: S,
    options?: RequestOptions,
  ) => Effect.Effect<
    Schema.Schema.Type<S>,
    RequestFailure,
    S["DecodingServices"]
  >;
  readonly put: (
    path: string,
    options?: RequestOptions,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>;
  readonly putJson: (
    path: string,
    options?: RequestOptions,
  ) => Effect.Effect<unknown, RequestFailure>;
  readonly putSchema: <S extends Schema.Top>(
    path: string,
    schema: S,
    options?: RequestOptions,
  ) => Effect.Effect<
    Schema.Schema.Type<S>,
    RequestFailure,
    S["DecodingServices"]
  >;
  readonly request: <Input>(
    descriptor: RequestDescriptor<Input>,
    input: Input,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>;
  readonly requestJson: <Input>(
    descriptor: RequestDescriptor<Input>,
    input: Input,
  ) => Effect.Effect<unknown, RequestFailure>;
  readonly requestSchema: <Input, S extends Schema.Top>(
    descriptor: SchemaRequestDescriptor<Input, S>,
    input: Input,
  ) => Effect.Effect<
    Schema.Schema.Type<S>,
    RequestFailure,
    S["DecodingServices"]
  >;
}

export class WebUntisHttp extends ServiceMap.Service<
  WebUntisHttp,
  WebUntisHttpShape
>()("webuntis/internal/WebUntisHttp") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const bootstrap = yield* Bootstrap;

      const execute: WebUntisHttpShape["execute"] = (
        method,
        path,
        options = {},
      ) =>
        Effect.gen(function* () {
          const state = yield* (options.policy ?? RequestPolicy.Metadata) ===
          RequestPolicy.AuthOnly
            ? bootstrap.ensureAuthenticated
            : bootstrap.ensureMetadata;
          const baseHeaders: Record<string, string> = {
            accept: defaultAcceptHeader,
          };
          const isAbsolute = /^https?:\/\//.test(path);
          const url = isAbsolute
            ? path
            : `${resolveBaseUrl(state.resolvedSchool)}/${path.replace(/^\/+/, "")}`;

          let request = HttpClientRequest.make(method)(url).pipe(
            HttpClientRequest.setUrlParams(options.query ?? {}),
            HttpClientRequest.setHeaders(
              mergeHeaders(baseHeaders, options.headers),
            ),
            HttpClientRequest.bearerToken(state.token),
          );

          if (state.tenantId) {
            request = HttpClientRequest.setHeader(
              request,
              "Tenant-Id",
              state.tenantId,
            );
          }
          if (
            (options.policy ?? RequestPolicy.Metadata) ===
              RequestPolicy.Metadata &&
            state.schoolYearId !== undefined
          ) {
            request = HttpClientRequest.setHeader(
              request,
              "X-Webuntis-Api-School-Year-Id",
              String(state.schoolYearId),
            );
          }
          if (method !== "GET" && options.body !== undefined) {
            request = yield* HttpClientRequest.bodyJson(
              request,
              options.body,
            ).pipe(
              Effect.mapError(
                (error) =>
                  new TransportError({
                    method,
                    path,
                    message: String(error),
                    cause: error,
                  }),
              ),
            );
          }

          const response = yield* bootstrap.client.execute(request).pipe(
            Effect.mapError(
              (error) =>
                new TransportError({
                  method,
                  path,
                  message: String(error),
                  cause: error,
                }),
            ),
          );

          if (response.status < 200 || response.status >= 300) {
            const body = yield* response.text.pipe(
              Effect.catch(() => Effect.succeed("")),
            );

            return yield* Effect.fail(
              new TransportError({
                method,
                path,
                status: response.status,
                body,
                message: `HTTP ${response.status} for ${method} ${path}`,
              }),
            );
          }

          return response;
        });

      const decodeSchema = <S extends Schema.Top>(
        path: string,
        schema: S,
        effect: Effect.Effect<
          HttpClientResponse.HttpClientResponse,
          RequestFailure
        >,
      ) =>
        effect.pipe(
          Effect.flatMap((response) =>
            HttpClientResponse.schemaBodyJson(
              schema as S,
              strictJsonParseOptions,
            )(response).pipe(
              Effect.mapError((error) =>
                error instanceof TransportError
                  ? error
                  : decodeError(path, error),
              ),
            ),
          ),
        ) as Effect.Effect<
          Schema.Schema.Type<S>,
          RequestFailure,
          S["DecodingServices"]
        >;

      const decodeJson = (
        path: string,
        effect: Effect.Effect<
          HttpClientResponse.HttpClientResponse,
          RequestFailure
        >,
      ) =>
        effect.pipe(
          Effect.flatMap((response) =>
            response.json.pipe(
              Effect.mapError((error) => decodeError(path, error)),
            ),
          ),
        );

      const request: WebUntisHttpShape["request"] = (descriptor, input) =>
        execute(
          descriptor.method,
          typeof descriptor.path === "function"
            ? descriptor.path(input)
            : descriptor.path,
          {
            body: descriptor.body?.(input),
            headers: descriptor.headers?.(input),
            policy: descriptor.policy,
            query: descriptor.query?.(input),
          },
        );

      const requestJson: WebUntisHttpShape["requestJson"] = (
        descriptor,
        input,
      ) =>
        decodeJson(
          typeof descriptor.path === "function"
            ? descriptor.path(input)
            : descriptor.path,
          request(descriptor, input),
        );

      const requestSchema: WebUntisHttpShape["requestSchema"] = (
        descriptor,
        input,
      ) =>
        decodeSchema(
          typeof descriptor.path === "function"
            ? descriptor.path(input)
            : descriptor.path,
          descriptor.schema,
          request(descriptor, input),
        );

      return WebUntisHttp.of({
        execute,
        get: (path, options) => execute("GET", path, options),
        getJson: (path, options) =>
          decodeJson(path, execute("GET", path, options)),
        getSchema: (path, schema, options) =>
          decodeSchema(path, schema, execute("GET", path, options)),
        post: (path, options) => execute("POST", path, options),
        postJson: (path, options) =>
          decodeJson(path, execute("POST", path, options)),
        postSchema: (path, schema, options) =>
          decodeSchema(path, schema, execute("POST", path, options)),
        put: (path, options) => execute("PUT", path, options),
        putJson: (path, options) =>
          decodeJson(path, execute("PUT", path, options)),
        putSchema: (path, schema, options) =>
          decodeSchema(path, schema, execute("PUT", path, options)),
        request,
        requestJson,
        requestSchema,
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}
