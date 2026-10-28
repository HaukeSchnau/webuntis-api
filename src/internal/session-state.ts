import { Clock, Context, Effect, Layer, Redacted, Ref, Schema, SynchronizedRef } from "effect";
import { Cookies, FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http";
import { RateLimiter } from "effect/persistence";
import { Connection, type Credential } from "./connection.ts";
import {
  AuthError,
  httpClientErrorToTransportError,
  InvalidCredentials,
  type LoginError,
} from "./errors.ts";
import { SchoolResolver } from "./school-resolver.ts";
import type { AuthenticatedState, SessionCache } from "./state.ts";
import { emptySessionState, hasFreshToken, tokenFallbackValidityMs } from "./state.ts";
import { makeConnectionClient } from "./transport.ts";

/** Only the claim we need; anything else in the payload is irrelevant here. */
const JwtPayloadSchema = Schema.Struct({
  exp: Schema.optional(Schema.Finite),
});

const decodeJwtPayload = Schema.decodeUnknownSync(JwtPayloadSchema);

/**
 * Reads the `exp` claim without verifying the signature. The token is minted by
 * the server we are talking to and is only used to decide when to refresh, so a
 * malformed or unreadable payload simply falls back to {@link tokenFallbackValidityMs}.
 */
const parseJwtExpiration = (token: string): number | undefined => {
  const payloadSegment = token.split(".")[1];
  if (payloadSegment === undefined) {
    return undefined;
  }

  try {
    const base64 = payloadSegment
      .replace(/-/gu, "+")
      .replace(/_/gu, "/")
      .padEnd(Math.ceil(payloadSegment.length / 4) * 4, "=");
    const payload = decodeJwtPayload(JSON.parse(atob(base64)));
    return payload.exp === undefined ? undefined : payload.exp * 1_000;
  } catch {
    return undefined;
  }
};

const loginResponseLooksLikeHtml = (body: string): boolean => {
  const trimmed = body.trimStart();
  return trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");
};

/** The form `j_spring_security_check` expects for each kind of credential. */
const loginForm = (loginName: string, credential: Credential) => {
  switch (credential._tag) {
    case "Password":
      return {
        school: loginName,
        j_username: credential.username,
        j_password: Redacted.value(credential.password),
      };
  }
};

/** What a login attempt yields to its caller, and the session state it leaves behind. */
type LoginAttempt = readonly [Effect.Effect<AuthenticatedState, InvalidCredentials>, SessionCache];

export interface SessionStateShape {
  /** The caller's client with this connection's limits, retries, and cookie jar applied. */
  readonly client: HttpClient.HttpClient;
  readonly ensureAuthenticated: Effect.Effect<AuthenticatedState, LoginError>;
  readonly refreshSession: Effect.Effect<AuthenticatedState, LoginError>;
  readonly invalidate: (expectedGeneration: number) => Effect.Effect<boolean>;
  readonly clear: Effect.Effect<void>;
}

export class SessionState extends Context.Service<SessionState, SessionStateShape>()(
  "webuntis/internal/SessionState",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const baseClient = yield* HttpClient.HttpClient;
      const { credential, limits } = yield* Connection;
      const limiter = yield* RateLimiter.RateLimiter;
      const schoolResolver = yield* SchoolResolver;
      const cookiesRef = yield* Ref.make(Cookies.empty);
      const stateRef = yield* SynchronizedRef.make<SessionCache>(emptySessionState());
      const client = (yield* makeConnectionClient(baseClient, limiter, limits)).pipe(
        HttpClient.withCookiesRef(cookiesRef),
      );

      const refreshSessionState = (previous: SessionCache) =>
        Effect.gen(function* () {
          const school = yield* schoolResolver.resolve;
          const { baseUrl } = school;

          const seedResponse = yield* client
            .execute(
              HttpClientRequest.get(`${baseUrl}/index.do`).pipe(HttpClientRequest.acceptJson),
            )
            .pipe(
              Effect.mapError((error) =>
                httpClientErrorToTransportError("GET", `${baseUrl}/index.do`, error),
              ),
            );

          if (seedResponse.status < 200 || seedResponse.status >= 400) {
            return yield* new AuthError({
              stage: "bootstrap",
              status: seedResponse.status,
              message: `Seed request failed for ${baseUrl}`,
            });
          }

          const loginResponse = yield* client
            .execute(
              HttpClientRequest.post(`${baseUrl}/j_spring_security_check`).pipe(
                HttpClientRequest.bodyUrlParams(loginForm(school.loginName, credential)),
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
            return yield* new AuthError({
              stage: "login",
              status: loginResponse.status,
              message: `WebUntis login handshake failed for ${credential.username}`,
            });
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
              return yield* new AuthError({
                stage: "login",
                status: loginResponse.status,
                message: "WebUntis login returned HTML instead of a redirect",
              });
            }
          }

          const tokenResponse = yield* client
            .execute(HttpClientRequest.get(`${baseUrl}/api/token/new`))
            .pipe(
              Effect.provideService(FetchHttpClient.RequestInit, {
                redirect: "manual",
              }),
              Effect.mapError((error) =>
                httpClientErrorToTransportError("GET", `${baseUrl}/api/token/new`, error),
              ),
            );

          // A rejected password still gets a 302 from the login form; only the
          // token endpoint tells, by redirecting to the anonymous start page.
          const rejected = new InvalidCredentials({
            school: school.loginName,
            message: `WebUntis rejected the credential for ${credential.username} at ${school.loginName}`,
          });

          if (
            (tokenResponse.status >= 300 && tokenResponse.status < 400) ||
            tokenResponse.status === 401
          ) {
            return yield* rejected;
          }

          if (tokenResponse.status < 200 || tokenResponse.status >= 300) {
            return yield* new AuthError({
              stage: "token",
              status: tokenResponse.status,
              message: `Token minting failed for ${baseUrl}`,
            });
          }

          const tokenString = (yield* tokenResponse.text.pipe(
            Effect.mapError((error) =>
              httpClientErrorToTransportError("GET", `${baseUrl}/api/token/new`, error),
            ),
          )).trim();

          if (tokenString.length === 0 || loginResponseLooksLikeHtml(tokenString)) {
            return yield* rejected;
          }

          const now = yield* Clock.currentTimeMillis;

          return {
            resolvedSchool: school,
            tenantId: school.tenantId,
            token: Redacted.make(tokenString),
            tokenExpiresAt: parseJwtExpiration(tokenString) ?? now + tokenFallbackValidityMs,
            generation: previous.generation + 1,
          } satisfies AuthenticatedState;
        });

      /** Logs in and records a refused credential so later calls fail without asking WebUntis. */
      const login = (state: SessionCache): Effect.Effect<LoginAttempt, LoginError> =>
        refreshSessionState(state).pipe(
          Effect.map((next): LoginAttempt => [Effect.succeed(next), next]),
          Effect.catchTag("InvalidCredentials", (error): Effect.Effect<LoginAttempt> =>
            Effect.succeed([
              Effect.fail(error),
              { ...emptySessionState(state.generation), rejected: error },
            ]),
          ),
        );

      const ensureAuthenticated = SynchronizedRef.modifyEffect(
        stateRef,
        (state): Effect.Effect<LoginAttempt, LoginError> =>
          Clock.currentTimeMillis.pipe(
            Effect.flatMap((now) => {
              if (state.rejected !== undefined) {
                return Effect.succeed<LoginAttempt>([Effect.fail(state.rejected), state]);
              }
              return hasFreshToken(state, now)
                ? Effect.succeed<LoginAttempt>([Effect.succeed(state), state])
                : login(state);
            }),
          ),
      ).pipe(Effect.flatten);

      const refreshSession = SynchronizedRef.modifyEffect(stateRef, login).pipe(Effect.flatten);

      const invalidate = (expectedGeneration: number) =>
        SynchronizedRef.modifyEffect(stateRef, (state) => {
          // A refused credential stays refused; a stale 401 must not reopen it.
          if (state.generation !== expectedGeneration || state.rejected !== undefined) {
            return Effect.succeed([false, state] as const);
          }

          return Ref.set(cookiesRef, Cookies.empty).pipe(
            Effect.as([true, emptySessionState(state.generation)] as const),
          );
        });

      const clear = SynchronizedRef.modifyEffect(stateRef, (state) =>
        Ref.set(cookiesRef, Cookies.empty).pipe(
          Effect.as([undefined, emptySessionState(state.generation)] as const),
        ),
      );

      return SessionState.of({
        client,
        ensureAuthenticated,
        refreshSession,
        invalidate,
        clear,
      });
    }),
  );
}
