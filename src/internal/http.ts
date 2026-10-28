import { Clock, Context, Effect, Layer, type Result, type Schema } from "effect";
import { HttpClientRequest, HttpClientResponse } from "effect/http";
import {
  type DecodeError,
  decodeError,
  errorMessage,
  responseError,
  TransportError,
  type WebUntisError,
} from "./errors.ts";
import { MetadataState } from "./metadata-state.ts";
import {
  type HeaderParams,
  type QueryParams,
  type RequestDescriptor,
  RequestPolicy,
  type ResolvedRequestDescriptor,
  type SchemaRequestDescriptor,
  validateAndResolveRequest,
} from "./request.ts";
import { decodeResponse } from "./schema.ts";
import { CurrentSchoolYearId } from "./school-year-context.ts";
import { SessionState } from "./session-state.ts";
import type { AuthenticatedState, MetadataSnapshot } from "./state.ts";

const defaultAcceptHeader = "application/json, text/plain, */*";
const absoluteUrlPattern = /^https?:\/\//u;
const leadingSlashes = /^\/+/u;

type HttpMethod = "GET" | "POST" | "PUT";
type RequestState = AuthenticatedState | MetadataSnapshot;

interface RequestOptions {
  readonly query?: QueryParams | undefined;
  readonly headers?: HeaderParams | undefined;
  readonly policy?: RequestPolicy | undefined;
  readonly body?: unknown;
  readonly supportsSchoolYearScope?: boolean | undefined;
}

const mergeHeaders = (
  current: Readonly<Record<string, string>>,
  extra: HeaderParams = {},
): Record<string, string> =>
  Object.fromEntries(
    Object.entries({ ...current, ...extra }).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );

const transportError = (method: HttpMethod, path: string, error: unknown) =>
  new TransportError({
    method,
    path,
    message: errorMessage(error),
    cause: error,
  });

const requestUrl = (state: RequestState, path: string): string =>
  absoluteUrlPattern.test(path)
    ? path
    : `${state.resolvedSchool.baseUrl}/${path.replace(leadingSlashes, "")}`;

/**
 * School year to scope the request to.
 *
 * A metadata-policy request always carries the tenant's current year. Requests
 * that opt into school-year scoping let an active {@link CurrentSchoolYearId}
 * override it, which is how historical reads reach past years.
 */
const resolveSchoolYearId = (
  state: RequestState,
  options: RequestOptions,
  currentSchoolYearId: number | undefined,
): number | undefined => {
  const metadataSchoolYearId =
    (options.policy ?? RequestPolicy.Metadata) === RequestPolicy.Metadata && "schoolYearId" in state
      ? state.schoolYearId
      : undefined;

  return options.supportsSchoolYearScope === true
    ? (currentSchoolYearId ?? metadataSchoolYearId)
    : metadataSchoolYearId;
};

const buildRequest = (
  state: RequestState,
  method: HttpMethod,
  path: string,
  options: RequestOptions,
) =>
  Effect.gen(function* () {
    const currentSchoolYearId = yield* CurrentSchoolYearId;

    let request = HttpClientRequest.make(method)(requestUrl(state, path)).pipe(
      HttpClientRequest.setUrlParams(options.query ?? {}),
      HttpClientRequest.setHeaders(mergeHeaders({ accept: defaultAcceptHeader }, options.headers)),
      HttpClientRequest.bearerToken(state.token),
    );

    if (state.tenantId !== undefined) {
      request = HttpClientRequest.setHeader(request, "Tenant-Id", state.tenantId);
    }

    const schoolYearId = resolveSchoolYearId(state, options, currentSchoolYearId);
    if (schoolYearId !== undefined) {
      request = HttpClientRequest.setHeader(
        request,
        "X-Webuntis-Api-School-Year-Id",
        String(schoolYearId),
      );
    }

    if (method !== "GET" && options.body !== undefined) {
      request = yield* HttpClientRequest.bodyJson(request, options.body).pipe(
        Effect.mapError((error) => transportError(method, path, error)),
      );
    }

    return request;
  });

/** Reads the body so the connection is released, ignoring whatever it holds. */
const drainBody = (response: HttpClientResponse.HttpClientResponse) =>
  response.text.pipe(Effect.orElseSucceed(() => ""));

const failIfNonSuccess = (
  method: HttpMethod,
  path: string,
  response: HttpClientResponse.HttpClientResponse,
) => {
  if (response.status >= 200 && response.status < 300) {
    return Effect.succeed(response);
  }

  return Effect.all([drainBody(response), Clock.currentTimeMillis]).pipe(
    Effect.flatMap(([body, now]) => Effect.fail(responseError(method, path, response, body, now))),
  );
};

export interface WebUntisHttpShape {
  readonly request: <Input>(
    descriptor: RequestDescriptor<Input>,
    input: Input,
  ) => Effect.Effect<HttpClientResponse.HttpClientResponse, WebUntisError>;
  readonly requestJson: <Input>(
    descriptor: RequestDescriptor<Input>,
    input: Input,
  ) => Effect.Effect<unknown, WebUntisError>;
  readonly requestSchema: <Input, S extends Schema.Top>(
    descriptor: SchemaRequestDescriptor<Input, S>,
    input: Input,
  ) => Effect.Effect<S["Type"], WebUntisError, S["DecodingServices"]>;
  /**
   * The parsed JSON body next to its decoding, so a caller can keep what the
   * runtime schema drops, or the whole body when decoding fails.
   */
  readonly requestDecoded: <Input, S extends Schema.Top>(
    descriptor: SchemaRequestDescriptor<Input, S>,
    input: Input,
  ) => Effect.Effect<Decoded<S["Type"]>, WebUntisError, S["DecodingServices"]>;
}

export interface Decoded<A> {
  readonly raw: unknown;
  readonly decoded: Result.Result<A, DecodeError>;
}

export class WebUntisHttp extends Context.Service<WebUntisHttp, WebUntisHttpShape>()(
  "webuntis/internal/WebUntisHttp",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const metadataState = yield* MetadataState;
      const sessionState = yield* SessionState;

      /**
       * Auth-only requests still need a tenant id. When the session did not
       * carry one, fall back to the metadata bootstrap so both the initial
       * attempt and its retry resolve the same headers (ADR 0001).
       */
      const resolveState = (policy: RequestPolicy) =>
        policy === RequestPolicy.AuthOnly
          ? sessionState.ensureAuthenticated.pipe(
              Effect.flatMap((session) =>
                session.tenantId === undefined
                  ? metadataState.ensureMetadata
                  : Effect.succeed<RequestState>(session),
              ),
            )
          : metadataState.ensureMetadata;

      const executeRequest = (
        state: RequestState,
        method: HttpMethod,
        path: string,
        options: RequestOptions,
      ) =>
        buildRequest(state, method, path, options).pipe(
          Effect.flatMap((request) =>
            sessionState.client
              .execute(request)
              .pipe(Effect.mapError((error) => transportError(method, path, error))),
          ),
        );

      /** Runs a request, retrying exactly once if the session was rejected. */
      const execute = (method: HttpMethod, path: string, options: RequestOptions = {}) =>
        Effect.gen(function* () {
          const policy = options.policy ?? RequestPolicy.Metadata;
          const attemptOptions = { ...options, policy };

          const state = yield* resolveState(policy);
          const initialResponse = yield* executeRequest(state, method, path, attemptOptions);

          // Only 401 means the session is gone. A 403 is a permission the
          // account lacks, and logging in again would not change it.
          if (initialResponse.status !== 401) {
            return yield* failIfNonSuccess(method, path, initialResponse);
          }

          yield* drainBody(initialResponse);
          yield* sessionState.invalidate(state.generation);

          const refreshedState = yield* resolveState(policy);
          const retriedResponse = yield* executeRequest(
            refreshedState,
            method,
            path,
            attemptOptions,
          );

          return yield* failIfNonSuccess(method, path, retriedResponse);
        });

      const executeResolved = (
        resolved: ResolvedRequestDescriptor,
      ): Effect.Effect<HttpClientResponse.HttpClientResponse, WebUntisError> =>
        execute(resolved.method, resolved.path, {
          body: resolved.body,
          headers: resolved.headers,
          policy: resolved.policy,
          query: resolved.query,
          supportsSchoolYearScope: resolved.supportsSchoolYearScope,
        });

      const request: WebUntisHttpShape["request"] = (descriptor, input) =>
        validateAndResolveRequest(descriptor, input).pipe(Effect.flatMap(executeResolved));

      const executeJson = (resolved: ResolvedRequestDescriptor) =>
        executeResolved(resolved).pipe(
          Effect.flatMap((response) =>
            response.json.pipe(Effect.mapError((error) => decodeError(resolved.path, error))),
          ),
        );

      const requestJson: WebUntisHttpShape["requestJson"] = (descriptor, input) =>
        validateAndResolveRequest(descriptor, input).pipe(Effect.flatMap(executeJson));

      const requestSchema: WebUntisHttpShape["requestSchema"] = (descriptor, input) =>
        validateAndResolveRequest(descriptor, input).pipe(
          Effect.flatMap((resolved) =>
            executeJson(resolved).pipe(
              Effect.flatMap(decodeResponse(descriptor.schema, resolved.path)),
            ),
          ),
        );

      const requestDecoded: WebUntisHttpShape["requestDecoded"] = (descriptor, input) =>
        validateAndResolveRequest(descriptor, input).pipe(
          Effect.flatMap((resolved) =>
            executeJson(resolved).pipe(
              Effect.flatMap((raw) =>
                decodeResponse(
                  descriptor.schema,
                  resolved.path,
                )(raw).pipe(
                  Effect.result,
                  Effect.map((decoded) => ({ raw, decoded })),
                ),
              ),
            ),
          ),
        );

      return WebUntisHttp.of({
        request,
        requestJson,
        requestSchema,
        requestDecoded,
      });
    }),
  );
}
