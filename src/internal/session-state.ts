import { Context, Effect, Layer, Redacted, Ref, SynchronizedRef } from "effect";
import * as Cookies from "effect/unstable/http/Cookies";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import { ClientConfig } from "./config.ts";
import {
  AuthError,
  type DecodeError,
  type DiscoveryError,
  httpClientErrorToTransportError,
  type TransportError,
} from "./errors.ts";
import { SchoolResolver } from "./school-resolver.ts";
import type {
  AuthenticatedState,
  SessionState as SessionCache,
} from "./types.ts";
import {
  emptySessionState,
  hasFreshToken,
  resolveBaseUrl,
  tokenFallbackValidityMs,
} from "./types.ts";

const parseJwtExpiration = (token: string): number | undefined => {
  const parts = token.split(".");
  const payloadSegment = parts[1];
  if (parts.length < 2 || payloadSegment === undefined) {
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

const loginResponseLooksLikeHtml = (body: string): boolean => {
  const trimmed = body.trimStart();
  return trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");
};

export interface SessionStateShape {
  readonly client: HttpClient.HttpClient;
  readonly ensureAuthenticated: () => Effect.Effect<
    AuthenticatedState,
    DiscoveryError | AuthError | TransportError | DecodeError
  >;
  readonly refreshSession: () => Effect.Effect<
    AuthenticatedState,
    DiscoveryError | AuthError | TransportError | DecodeError
  >;
  readonly refreshToken: () => Effect.Effect<
    string,
    DiscoveryError | AuthError | TransportError | DecodeError
  >;
  readonly clear: () => Effect.Effect<void>;
}

export class SessionState extends Context.Service<
  SessionState,
  SessionStateShape
>()("webuntis/internal/SessionState") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const baseClient = yield* HttpClient.HttpClient;
      const clientConfig = yield* ClientConfig;
      const schoolResolver = yield* SchoolResolver;
      const cookiesRef = yield* Ref.make(Cookies.empty);
      const stateRef = yield* SynchronizedRef.make<SessionCache>(
        emptySessionState(),
      );
      const client = baseClient.pipe(HttpClient.withCookiesRef(cookiesRef));

      const refreshSessionState = (previous: SessionCache) =>
        Effect.gen(function* () {
          const school = yield* schoolResolver.resolve();
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

          if (loginResponse.status === 200) {
            const loginBody = yield* loginResponse.text.pipe(
              Effect.mapError((error) =>
                httpClientErrorToTransportError(
                  "POST",
                  `${baseUrl}/j_spring_security_check`,
                  error,
                ),
              ),
            );

            if (loginResponseLooksLikeHtml(loginBody)) {
              return yield* Effect.fail(
                new AuthError({
                  stage: "login",
                  status: loginResponse.status,
                  message: "WebUntis login returned HTML instead of a redirect",
                }),
              );
            }
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

          if (tokenResponse.status < 200 || tokenResponse.status >= 300) {
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

          if (
            tokenString.length === 0 ||
            loginResponseLooksLikeHtml(tokenString)
          ) {
            return yield* Effect.fail(
              new AuthError({
                stage: "token",
                message: "Token minting redirected to anonymous WebUntis HTML",
              }),
            );
          }

          return {
            resolvedSchool: school,
            tenantId: clientConfig.tenantId ?? school.tenantId,
            token: Redacted.make(tokenString),
            tokenExpiresAt:
              parseJwtExpiration(tokenString) ??
              Date.now() + tokenFallbackValidityMs,
            generation: previous.generation + 1,
          } satisfies AuthenticatedState;
        });

      const ensureAuthenticated = () =>
        SynchronizedRef.modifyEffect(stateRef, (state) =>
          hasFreshToken(state)
            ? Effect.succeed([state, state] as const)
            : refreshSessionState(state).pipe(
                Effect.map((nextState) => [nextState, nextState] as const),
              ),
        );

      const refreshSession = () =>
        SynchronizedRef.modifyEffect(stateRef, (state) =>
          refreshSessionState(state).pipe(
            Effect.map((nextState) => [nextState, nextState] as const),
          ),
        );

      const refreshToken = () =>
        refreshSession().pipe(
          Effect.map((state) => Redacted.value(state.token)),
        );

      const clear = () =>
        Ref.set(cookiesRef, Cookies.empty).pipe(
          Effect.andThen(SynchronizedRef.set(stateRef, emptySessionState())),
        );

      return SessionState.of({
        client,
        ensureAuthenticated,
        refreshSession,
        refreshToken,
        clear,
      });
    }),
  );
}
