import { Context, Effect, Layer, type Schema } from "effect";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import {
  type AuthError,
  type DecodeError,
  type DiscoveryError,
  decodeError,
  errorMessage,
  type InvalidRequestError,
  TransportError,
  type TransportError as TransportErrorType,
} from "./errors.ts";
import { MetadataState } from "./metadata-state.ts";
import {
  type RequestDescriptor,
  RequestPolicy,
  type RequestPolicy as RequestPolicyType,
  type ResolvedRequestDescriptor,
  type SchemaRequestDescriptor,
  validateAndResolveRequest,
} from "./request.ts";
import { runtimeJsonParseOptions } from "./schema.ts";
import { CurrentSchoolYearId } from "./school-year-context.ts";
import { SessionState } from "./session-state.ts";
import type { AuthenticatedState, MetadataSnapshot } from "./types.ts";
import { resolveBaseUrl } from "./types.ts";

const defaultAcceptHeader = "application/json, text/plain, */*";

export type RequestFailure =
  | DiscoveryError
  | AuthError
  | TransportErrorType
  | DecodeError
  | InvalidRequestError;

interface RequestOptions {
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly headers?: Readonly<Record<string, string | undefined>>;
  readonly policy?: RequestPolicyType | undefined;
  readonly body?: unknown;
  readonly supportsSchoolYearScope?: boolean | undefined;
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
  ) => Effect.Effect<Schema.Schema.Type<S>, RequestFailure, S["DecodingServices"]>;
}

export class WebUntisHttp extends Context.Service<WebUntisHttp, WebUntisHttpShape>()(
  "webuntis/internal/WebUntisHttp",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const metadataState = yield* MetadataState;
      const sessionState = yield* SessionState;

      const resolveState = (policy: RequestPolicyType) =>
        policy === RequestPolicy.AuthOnly
          ? sessionState.ensureAuthenticated.pipe(
              Effect.flatMap((session) =>
                session.tenantId !== undefined
                  ? Effect.succeed(session)
                  : metadataState.ensureMetadata,
              ),
            )
          : metadataState.ensureMetadata;

      const buildRequest = (
        state: AuthenticatedState | MetadataSnapshot,
        method: "GET" | "POST" | "PUT",
        path: string,
        options: RequestOptions,
      ) =>
        Effect.gen(function* () {
          const currentSchoolYearId = yield* CurrentSchoolYearId;
          const baseHeaders: Record<string, string> = {
            accept: defaultAcceptHeader,
          };
          const isAbsolute = /^https?:\/\//.test(path);
          const url = isAbsolute
            ? path
            : `${resolveBaseUrl(state.resolvedSchool)}/${path.replace(/^\/+/, "")}`;

          let request = HttpClientRequest.make(method)(url).pipe(
            HttpClientRequest.setUrlParams(options.query ?? {}),
            HttpClientRequest.setHeaders(mergeHeaders(baseHeaders, options.headers)),
            HttpClientRequest.bearerToken(state.token),
          );

          if (state.tenantId !== undefined) {
            request = HttpClientRequest.setHeader(request, "Tenant-Id", state.tenantId);
          }

          const metadataSchoolYearId =
            (options.policy ?? RequestPolicy.Metadata) === RequestPolicy.Metadata &&
            "schoolYearId" in state
              ? state.schoolYearId
              : undefined;
          const schoolYearId = options.supportsSchoolYearScope
            ? (currentSchoolYearId ?? metadataSchoolYearId)
            : metadataSchoolYearId;

          if (schoolYearId !== undefined) {
            request = HttpClientRequest.setHeader(
              request,
              "X-Webuntis-Api-School-Year-Id",
              String(schoolYearId),
            );
          }
          if (method !== "GET" && options.body !== undefined) {
            request = yield* HttpClientRequest.bodyJson(request, options.body).pipe(
              Effect.mapError(
                (error) =>
                  new TransportError({
                    method,
                    path,
                    message: errorMessage(error),
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
                    message: errorMessage(error),
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
          Effect.orElseSucceed(() => ""),
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

      const execute = (
        method: "GET" | "POST" | "PUT",
        path: string,
        options: RequestOptions = {},
      ) =>
        Effect.gen(function* () {
          const policy = options.policy ?? RequestPolicy.Metadata;
          const state = yield* resolveState(policy);
          const initialResponse = yield* executeRequest(state, method, path, {
            ...options,
            policy,
          });

          if (initialResponse.status !== 401 && initialResponse.status !== 403) {
            return yield* failIfNonSuccess(method, path, initialResponse);
          }

          yield* initialResponse.text.pipe(Effect.orElseSucceed(() => ""));
          yield* sessionState.invalidate(state.generation);

          const refreshedState = yield* resolveState(policy);
          const retriedResponse = yield* executeRequest(refreshedState, method, path, {
            ...options,
            policy,
          });

          return yield* failIfNonSuccess(method, path, retriedResponse);
        });

      const decodeSchema = <S extends Schema.Top>(
        path: string,
        schema: S,
        effect: Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>,
      ) =>
        effect.pipe(
          Effect.flatMap((response) =>
            HttpClientResponse.schemaBodyJson(
              schema as S,
              runtimeJsonParseOptions,
            )(response).pipe(
              Effect.mapError((error) =>
                error instanceof TransportError ? error : decodeError(path, error),
              ),
            ),
          ),
        ) as Effect.Effect<Schema.Schema.Type<S>, RequestFailure, S["DecodingServices"]>;

      const decodeJson = (
        path: string,
        effect: Effect.Effect<HttpClientResponse.HttpClientResponse, RequestFailure>,
      ) =>
        effect.pipe(
          Effect.flatMap((response) =>
            response.json.pipe(Effect.mapError((error) => decodeError(path, error))),
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
          supportsSchoolYearScope: resolved.supportsSchoolYearScope,
        });

      const request: WebUntisHttpShape["request"] = (descriptor, input) =>
        validateAndResolveRequest(descriptor, input).pipe(Effect.flatMap(executeResolved));

      const requestJson: WebUntisHttpShape["requestJson"] = (descriptor, input) =>
        validateAndResolveRequest(descriptor, input).pipe(
          Effect.flatMap((resolved) => decodeJson(resolved.path, executeResolved(resolved))),
        );

      const requestSchema: WebUntisHttpShape["requestSchema"] = (descriptor, input) =>
        validateAndResolveRequest(descriptor, input).pipe(
          Effect.flatMap((resolved) =>
            decodeSchema(resolved.path, descriptor.schema, executeResolved(resolved)),
          ),
        );

      return WebUntisHttp.of({
        request,
        requestJson,
        requestSchema,
      });
    }),
  );
}
