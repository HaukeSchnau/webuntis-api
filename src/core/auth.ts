import { Effect, Layer, Redacted, ServiceMap } from "effect";
import * as Cookies from "effect/unstable/http/Cookies";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import type { ClientConfig } from "./config.ts";
import { ClientConfig as ClientConfigTag } from "./config.ts";
import { AuthenticationError } from "./errors.ts";
import type { ResolvedSchool, SessionState } from "./types.ts";
import { resolveBaseUrl, resolveTenantHost } from "./types.ts";
import { SchoolDiscovery } from "./discovery.ts";
import { SessionStore } from "./session-store.ts";

const parseJwtExpiration = (token: string): number | undefined => {
  const parts = token.split(".");
  if (parts.length < 2) {
    return undefined;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1]!.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp * 1_000 : undefined;
  } catch {
    return undefined;
  }
};

const mergeCookieHeader = (cookies: Cookies.Cookies) =>
  Cookies.isEmpty(cookies) ? {} : { cookie: Cookies.toCookieHeader(cookies) };

const resolveSchool = (
  config: ClientConfig,
  discovery: SchoolDiscovery
): Effect.Effect<ResolvedSchool, unknown> => {
  if (config.server && config.schoolLoginName) {
    const baseServerUrl = config.serverUrl ?? `https://${config.server}/WebUntis/?school=${config.schoolLoginName}`;
    return Effect.succeed({
      displayName: config.schoolName,
      loginName: config.schoolLoginName,
      server: config.server,
      serverUrl: baseServerUrl,
      schoolId: 0,
      tenantId: config.tenantId ?? "unknown"
    });
  }

  return discovery.resolve(config.schoolName);
};

export interface AuthClient {
  readonly ensureAuthenticated: Effect.Effect<SessionState, unknown>;
  readonly refreshToken: Effect.Effect<string, unknown>;
  readonly clear: Effect.Effect<void>;
}

export const AuthClient = ServiceMap.Service<AuthClient, AuthClient>("webuntis/AuthClient");

export const Live = Layer.effect(AuthClient)(
  Effect.gen(function*() {
    const baseClient = yield* HttpClient.HttpClient;
    const config = yield* ClientConfigTag;
    const discovery = yield* SchoolDiscovery;
    const sessionStore = yield* SessionStore;

    const bootstrapCookies = (school: ResolvedSchool) =>
      Effect.gen(function*() {
        const baseUrl = resolveBaseUrl(school);
        const state = yield* sessionStore.get;

        const seedResponse = yield* baseClient.get(`${baseUrl}/index.do`, {
          headers: mergeCookieHeader(state.cookies)
        }).pipe(Effect.flatMap(HttpClientResponse.filterStatusOk));

        const loginRequest = HttpClientRequest.post(`${baseUrl}/j_spring_security_check`).pipe(
          HttpClientRequest.bodyUrlParams({
            school: school.loginName,
            j_username: config.username,
            j_password: Redacted.value(config.password)
          }),
          HttpClientRequest.setHeaders({
            ...mergeCookieHeader(Cookies.merge(state.cookies, seedResponse.cookies)),
            accept: "application/json, text/plain, */*"
          })
        );

        const loginResponse = yield* baseClient.execute(loginRequest).pipe(
          Effect.flatMap(HttpClientResponse.filterStatusOk),
          Effect.mapError(() =>
            new AuthenticationError({
              stage: "login",
              message: `WebUntis login handshake failed for ${config.username}`
            }))
        );

        const cookies = Cookies.merge(Cookies.merge(state.cookies, seedResponse.cookies), loginResponse.cookies);
        yield* sessionStore.update((previous) => ({
          ...previous,
          cookies,
          resolvedSchool: {
            ...school,
            tenantId: school.tenantId === "unknown"
              ? config.tenantId ?? previous.tenantId ?? "unknown"
              : school.tenantId
          }
        }));

        return cookies;
      });

    const refreshToken = Effect.gen(function*() {
      const school = yield* resolveSchool(config, discovery).pipe(
        Effect.mapError((error) =>
          error instanceof AuthenticationError
            ? error
            : new AuthenticationError({
              stage: "bootstrap",
              message: String(error)
            }))
      );

      const cookies = yield* bootstrapCookies(school);
      const baseUrl = resolveBaseUrl(school);

      const tokenResponse = yield* baseClient.get(`${baseUrl}/api/token/new`, {
        headers: mergeCookieHeader(cookies)
      }).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.mapError(() =>
          new AuthenticationError({
            stage: "token",
            message: `Token minting failed for ${school.server}`
          }))
      );

        const tokenString = (yield* tokenResponse.text).trim();
        if (tokenString.length === 0 || tokenString.startsWith("<!DOCTYPE")) {
          return yield* Effect.fail(
            new AuthenticationError({
            stage: "token",
            message: "Token minting redirected to anonymous WebUntis HTML"
          })
        );
      }

      yield* sessionStore.update((previous) => ({
        ...previous,
        cookies: Cookies.merge(previous.cookies, tokenResponse.cookies),
        resolvedSchool: previous.resolvedSchool ?? school,
        tenantId: previous.tenantId ?? config.tenantId ?? school.tenantId,
        token: Redacted.make(tokenString),
        tokenExpiresAt: parseJwtExpiration(tokenString)
      }));

      return tokenString;
    });

    const ensureAuthenticated = Effect.gen(function*() {
      const state = yield* sessionStore.get;
      const now = Date.now();
      if (state.token && state.tokenExpiresAt && state.tokenExpiresAt - now > 60_000) {
        return state;
      }

      yield* refreshToken;
      return yield* sessionStore.get;
    });

    return {
      ensureAuthenticated,
      refreshToken,
      clear: sessionStore.clear
    };
  })
);
