import { Context, Effect, Layer } from "effect";
import type { AuthError, DecodeError, DiscoveryError, TransportError } from "./internal/errors.ts";
import { MetadataState } from "./internal/metadata-state.ts";
import { SessionState } from "./internal/session-state.ts";

export interface AuthClientShape {
  readonly ensureAuthenticated: Effect.Effect<
    void,
    DiscoveryError | AuthError | TransportError | DecodeError
  >;
  readonly refresh: Effect.Effect<void, DiscoveryError | AuthError | TransportError | DecodeError>;
  readonly clear: Effect.Effect<void>;
}

export class AuthClient extends Context.Service<AuthClient, AuthClientShape>()(
  "webuntis/AuthClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const sessionState = yield* SessionState;
      const metadataState = yield* MetadataState;

      return AuthClient.of({
        ensureAuthenticated: sessionState.ensureAuthenticated.pipe(
          Effect.withSpan("AuthClient.ensureAuthenticated"),
        ),
        refresh: sessionState.refreshSession.pipe(Effect.withSpan("AuthClient.refresh")),
        clear: Effect.gen(function* () {
          yield* metadataState.clear;
          yield* sessionState.clear;
        }).pipe(Effect.withSpan("AuthClient.clear")),
      });
    }),
  );
}
