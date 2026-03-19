import { Effect, Layer, ServiceMap } from "effect";
import { Bootstrap } from "./bootstrap.ts";
import type { AuthenticatedState } from "./types.ts";
import type { DecodeError, DiscoveryError, AuthError, TransportError } from "./errors.ts";

export interface AuthClient {
  readonly ensureAuthenticated: Effect.Effect<AuthenticatedState, DiscoveryError | AuthError | TransportError | DecodeError>;
  readonly refreshToken: Effect.Effect<string, DiscoveryError | AuthError | TransportError>;
  readonly clear: Effect.Effect<void>;
}

export const AuthClient = ServiceMap.Service<AuthClient, AuthClient>("webuntis/AuthClient");

export const makeAuthClient = Effect.gen(function*() {
  const bootstrap = yield* Bootstrap;

  return {
    ensureAuthenticated: bootstrap.ensureAuthenticated,
    refreshToken: bootstrap.refreshToken,
    clear: bootstrap.clear
  } satisfies AuthClient;
});

export const Live = Layer.effect(AuthClient, makeAuthClient);
