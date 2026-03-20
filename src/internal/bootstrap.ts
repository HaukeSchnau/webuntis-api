import {
  Effect,
  Layer,
  Redacted,
  Ref,
  Schema,
  ServiceMap,
  SynchronizedRef,
} from "effect";
import * as Cookies from "effect/unstable/http/Cookies";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import { ClientConfig } from "./config.ts";
import { SchoolDiscovery } from "./discovery.ts";
import {
  AuthError,
  type DecodeError,
  DiscoveryError,
  decodeError,
  httpClientErrorToTransportError,
  type TransportError,
} from "./errors.ts";
import { strictJsonParseOptions } from "./schema.ts";
import type {
  AuthenticatedState,
  BootstrapMetadata,
  BootstrapState,
  ResolvedSchool,
} from "./types.ts";
import {
  emptyBootstrapState,
  hasBootstrapMetadata,
  hasFreshToken,
  resolveBaseUrl,
  resolveTenantHost,
} from "./types.ts";

const BootstrapAppDataSchema = Schema.Struct({
  currentSchoolYear: Schema.Struct({
    id: Schema.Number,
  }),
  tenant: Schema.Struct({
    id: Schema.String,
  }),
});

const parseJwtExpiration = (token: string): number | undefined => {
  const parts = token.split(".");
  const payloadSegment = parts[1];
  if (parts.length < 2) {
    return undefined;
  }
  if (payloadSegment === undefined) {
    return undefined;
  }

  try {
    const base64 = payloadSegment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadSegment.length / 4) * 4, "=");
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === "number" ? payload.exp * 1_000 : undefined;
  } catch {
    return undefined;
  }
};

const resolveSchool = (
  clientConfig: ClientConfig["Service"],
  discovery: SchoolDiscovery["Service"],
): Effect.Effect<
  ResolvedSchool,
  DiscoveryError | AuthError | TransportError
> => {
  const tenantHost = resolveTenantHost(clientConfig);

  if (tenantHost && clientConfig.schoolLoginName) {
    return Effect.succeed({
      displayName: clientConfig.schoolName,
      loginName: clientConfig.schoolLoginName,
      server: tenantHost,
      serverUrl:
        clientConfig.serverUrl ??
        `https://${tenantHost}/WebUntis/?school=${clientConfig.schoolLoginName}`,
      schoolId: 0,
      tenantId: clientConfig.tenantId ?? "unknown",
    });
  }

  return discovery.resolve(clientConfig.schoolName).pipe(
    Effect.mapError((error) =>
      error instanceof DiscoveryError
        ? error
        : new AuthError({
            stage: "discovery",
            message: String(error),
            cause: error,
          }),
    ),
  );
};

export interface BootstrapShape {
  readonly client: HttpClient.HttpClient;
  readonly ensureAuthenticated: Effect.Effect<
    AuthenticatedState,
    DiscoveryError | AuthError | TransportError | DecodeError
  >;
  readonly ensureMetadata: Effect.Effect<
    BootstrapMetadata,
    DiscoveryError | AuthError | TransportError | DecodeError
  >;
  readonly refreshToken: Effect.Effect<
    string,
    DiscoveryError | AuthError | TransportError
  >;
  readonly clear: Effect.Effect<void>;
}

export class Bootstrap extends ServiceMap.Service<Bootstrap, BootstrapShape>()(
  "webuntis/internal/Bootstrap",
) {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const baseClient = yield* HttpClient.HttpClient;
      const clientConfig = yield* ClientConfig;
      const discovery = yield* SchoolDiscovery;
      const cookiesRef = yield* Ref.make(Cookies.empty);
      const stateRef = yield* SynchronizedRef.make<BootstrapState>(
        emptyBootstrapState(),
      );
      const client = baseClient.pipe(HttpClient.withCookiesRef(cookiesRef));

      const refreshTokenState = (previous: BootstrapState) =>
        Effect.gen(function* () {
          const school = yield* resolveSchool(clientConfig, discovery);
          const baseUrl = resolveBaseUrl(school);

          const seedResponse = yield* client
            .execute(
              HttpClientRequest.get(`${baseUrl}/index.do`).pipe(
                HttpClientRequest.acceptJson,
              ),
            )
            .pipe(
              Effect.mapError((error) =>
                httpClientErrorToTransportError(
                  "GET",
                  `${baseUrl}/index.do`,
                  error,
                ),
              ),
            );

          if (seedResponse.status < 200 || seedResponse.status >= 400) {
            return yield* Effect.fail(
              new AuthError({
                stage: "bootstrap",
                status: seedResponse.status,
                message: `Seed request failed for ${school.server}`,
              }),
            );
          }

          const loginResponse = yield* client
            .execute(
              HttpClientRequest.post(`${baseUrl}/j_spring_security_check`).pipe(
                HttpClientRequest.bodyUrlParams({
                  school: school.loginName,
                  j_username: clientConfig.username,
                  j_password: Redacted.value(clientConfig.password),
                }),
              ),
            )
            .pipe(
              Effect.provideService(FetchHttpClient.RequestInit, {
                redirect: "manual",
              }),
              Effect.mapError((error) =>
                httpClientErrorToTransportError(
                  "POST",
                  `${baseUrl}/j_spring_security_check`,
                  error,
                ),
              ),
            );

          if (loginResponse.status < 200 || loginResponse.status >= 400) {
            return yield* Effect.fail(
              new AuthError({
                stage: "login",
                status: loginResponse.status,
                message: `WebUntis login handshake failed for ${clientConfig.username}`,
              }),
            );
          }

          const tokenResponse = yield* client
            .execute(HttpClientRequest.get(`${baseUrl}/api/token/new`))
            .pipe(
              Effect.provideService(FetchHttpClient.RequestInit, {
                redirect: "manual",
              }),
              Effect.mapError((error) =>
                httpClientErrorToTransportError(
                  "GET",
                  `${baseUrl}/api/token/new`,
                  error,
                ),
              ),
            );

          if (tokenResponse.status >= 300) {
            return yield* Effect.fail(
              new AuthError({
                stage: "token",
                status: tokenResponse.status,
                message: `Token minting failed for ${school.server}`,
              }),
            );
          }

          const tokenString = (yield* tokenResponse.text.pipe(
            Effect.mapError((error) =>
              httpClientErrorToTransportError(
                "GET",
                `${baseUrl}/api/token/new`,
                error,
              ),
            ),
          )).trim();

          if (tokenString.length === 0 || tokenString.startsWith("<!DOCTYPE")) {
            return yield* Effect.fail(
              new AuthError({
                stage: "token",
                message: "Token minting redirected to anonymous WebUntis HTML",
              }),
            );
          }

          return {
            ...previous,
            resolvedSchool: school,
            tenantId:
              previous.tenantId ?? clientConfig.tenantId ?? school.tenantId,
            schoolYearId: undefined,
            token: Redacted.make(tokenString),
            tokenExpiresAt: parseJwtExpiration(tokenString),
          } satisfies BootstrapState;
        });

      const fetchMetadata = (
        state: AuthenticatedState,
      ): Effect.Effect<
        BootstrapState,
        AuthError | TransportError | DecodeError
      > =>
        client
          .execute(
            HttpClientRequest.get(
              `${resolveBaseUrl(state.resolvedSchool)}/api/rest/view/v1/app/data`,
            ).pipe(
              HttpClientRequest.acceptJson,
              HttpClientRequest.bearerToken(state.token),
            ),
          )
          .pipe(
            Effect.mapError((error) =>
              httpClientErrorToTransportError(
                "GET",
                "api/rest/view/v1/app/data",
                error,
              ),
            ),
            Effect.flatMap(
              (
                response,
              ): Effect.Effect<
                Schema.Schema.Type<typeof BootstrapAppDataSchema>,
                AuthError | TransportError | DecodeError
              > => {
                if (response.status < 200 || response.status >= 300) {
                  return response.text.pipe(
                    Effect.mapError((error) =>
                      httpClientErrorToTransportError(
                        "GET",
                        "api/rest/view/v1/app/data",
                        error,
                      ),
                    ),
                    Effect.flatMap((body) =>
                      Effect.fail(
                        new AuthError({
                          stage: "metadata",
                          status: response.status,
                          message: `Metadata bootstrap failed: ${body}`,
                        }),
                      ),
                    ),
                  );
                }

                return HttpClientResponse.schemaBodyJson(
                  BootstrapAppDataSchema,
                  strictJsonParseOptions,
                )(response).pipe(
                  Effect.mapError((error) =>
                    decodeError("api/rest/view/v1/app/data", error),
                  ),
                );
              },
            ),
            Effect.map(
              (appData: Schema.Schema.Type<typeof BootstrapAppDataSchema>) =>
                ({
                  ...state,
                  tenantId: appData.tenant.id,
                  schoolYearId: appData.currentSchoolYear.id,
                }) satisfies BootstrapState,
            ),
          );

      const ensureAuthenticated: BootstrapShape["ensureAuthenticated"] =
        SynchronizedRef.modifyEffect(stateRef, (state) =>
          hasFreshToken(state)
            ? Effect.succeed([state, state] as const)
            : refreshTokenState(state).pipe(
                Effect.map(
                  (nextState) =>
                    [nextState as AuthenticatedState, nextState] as const,
                ),
              ),
        );

      const ensureMetadata: BootstrapShape["ensureMetadata"] =
        SynchronizedRef.modifyEffect(stateRef, (state) => {
          const loadAuthenticated: Effect.Effect<
            AuthenticatedState,
            DiscoveryError | AuthError | TransportError | DecodeError
          > = hasFreshToken(state)
            ? Effect.succeed(state)
            : refreshTokenState(state).pipe(
                Effect.map((nextState) => nextState as AuthenticatedState),
              );

          return loadAuthenticated.pipe(
            Effect.flatMap((currentState) =>
              hasBootstrapMetadata(currentState)
                ? Effect.succeed([currentState, currentState] as const)
                : fetchMetadata(currentState).pipe(
                    Effect.map(
                      (nextState) =>
                        [nextState as BootstrapMetadata, nextState] as const,
                    ),
                  ),
            ),
          );
        });

      const refreshToken: BootstrapShape["refreshToken"] =
        SynchronizedRef.modifyEffect(stateRef, (state) =>
          refreshTokenState(state).pipe(
            Effect.map((nextState) => {
              const token = nextState.token;
              if (token === undefined) {
                throw new Error("refreshTokenState returned without a token");
              }

              return [Redacted.value(token), nextState] as const;
            }),
          ),
        );

      const clear = Ref.set(cookiesRef, Cookies.empty).pipe(
        Effect.andThen(SynchronizedRef.set(stateRef, emptyBootstrapState())),
      );

      return Bootstrap.of({
        client,
        ensureAuthenticated,
        ensureMetadata,
        refreshToken,
        clear,
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}
