import { Effect, Layer, type Schema, ServiceMap } from "effect";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import {
  type AuthError,
  type DecodeError,
  type DiscoveryError,
  decodeError,
  TransportError,
  type TransportError as TransportErrorType,
} from "./errors.ts";
import { MetadataState } from "./metadata-state.ts";
import {
  type RequestDescriptor,
  RequestPolicy,
  type RequestPolicy as RequestPolicyType,
  type ResolvedRequestDescriptor,
  resolveRequest,
  type SchemaRequestDescriptor,
} from "./request.ts";
import { strictJsonParseOptions } from "./schema.ts";
import { SessionState } from "./session-state.ts";
import type { AuthenticatedState, MetadataSnapshot } from "./types.ts";
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
      const metadataState = yield* MetadataState;
      const sessionState = yield* SessionState;

      const resolveState = (policy: RequestPolicyType) =>
        policy === RequestPolicy.AuthOnly
          ? sessionState.ensureAuthenticated()
          : metadataState.ensureMetadata();

      const buildRequest = (
        state: AuthenticatedState | MetadataSnapshot,
        method: "GET" | "POST" | "PUT",
        path: string,
        options: RequestOptions,
      ) =>
        Effect.gen(function* () {
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

          if (state.tenantId !== undefined) {
            request = HttpClientRequest.setHeader(
              request,
              "Tenant-Id",
              state.tenantId,
            );
          }

          if (
            (options.policy ?? RequestPolicy.Metadata) ===
              RequestPolicy.Metadata &&
            "schoolYearId" in state &&
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

          return request;
        });

      const executeRequest = (
        state: AuthenticatedState | MetadataSnapshot,
        method: "GET" | "POST" | "PUT",
        path: string,
        options: RequestOptions,
      ) =>
        buildRequest(state, method, path, options).pipe(
          Effect.flatMap((request) =>
            sessionState.client.execute(request).pipe(
              Effect.mapError(
                (error) =>
                  new TransportError({
                    method,
                    path,
                    message: String(error),
                    cause: error,
                  }),
              ),
            ),
          ),
        );

      const failIfNonSuccess = (
        method: "GET" | "POST" | "PUT",
        path: string,
        response: HttpClientResponse.HttpClientResponse,
      ) => {
        if (response.status >= 200 && response.status < 300) {
          return Effect.succeed(response);
        }

        return response.text.pipe(
          Effect.catch(() => Effect.succeed("")),
          Effect.flatMap((body) =>
            Effect.fail(
              new TransportError({
                method,
                path,
                status: response.status,
                body,
                message: `HTTP ${response.status} for ${method} ${path}`,
              }),
            ),
          ),
        );
      };

      const execute: WebUntisHttpShape["execute"] = (
        method,
        path,
        options = {},
      ) =>
        Effect.gen(function* () {
          const policy = options.policy ?? RequestPolicy.Metadata;
          const state =
            policy === RequestPolicy.AuthOnly
              ? yield* sessionState
                  .ensureAuthenticated()
                  .pipe(
                    Effect.flatMap((session) =>
                      session.tenantId !== undefined
                        ? Effect.succeed(session)
                        : metadataState.ensureMetadata(),
                    ),
                  )
              : yield* metadataState.ensureMetadata();
          const initialResponse = yield* executeRequest(state, method, path, {
            ...options,
            policy,
          });

          if (
            initialResponse.status !== 401 &&
            initialResponse.status !== 403
          ) {
            return yield* failIfNonSuccess(method, path, initialResponse);
          }

          yield* metadataState.clear();
          yield* sessionState.clear();

          const refreshedState = yield* resolveState(policy);
          const retriedResponse = yield* executeRequest(
            refreshedState,
            method,
            path,
            {
              ...options,
              policy,
            },
          );

          return yield* failIfNonSuccess(method, path, retriedResponse);
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

      const executeResolved = (
        resolved: ResolvedRequestDescriptor,
      ): Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure> =>
        execute(resolved.method, resolved.path, {
          body: resolved.body,
          headers: resolved.headers,
          policy: resolved.policy,
          query: resolved.query,
        });

      const request: WebUntisHttpShape["request"] = (descriptor, input) => {
        const resolved = resolveRequest(descriptor, input);
        return executeResolved(resolved);
      };

      const requestJson: WebUntisHttpShape["requestJson"] = (
        descriptor,
        input,
      ) => {
        const resolved = resolveRequest(descriptor, input);
        return decodeJson(resolved.path, executeResolved(resolved));
      };

      const requestSchema: WebUntisHttpShape["requestSchema"] = (
        descriptor,
        input,
      ) => {
        const resolved = resolveRequest(descriptor, input);

        return decodeSchema(
          resolved.path,
          descriptor.schema,
          executeResolved(resolved),
        );
      };

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
}
