import { Effect, Layer, ServiceMap } from "effect";
import type {
  AuthError,
  DecodeError,
  DiscoveryError,
  TransportError,
} from "./internal/errors.ts";
import { MetadataState } from "./internal/metadata-state.ts";
import { SessionState } from "./internal/session-state.ts";
import type { AuthenticatedState } from "./internal/types.ts";

export interface AuthClientShape {
  readonly ensureAuthenticated: () => Effect.Effect<
    AuthenticatedState,
    DiscoveryError | AuthError | TransportError | DecodeError
  >;
  readonly refreshToken: () => Effect.Effect<
    string,
    DiscoveryError | AuthError | TransportError | DecodeError
  >;
  readonly clear: () => Effect.Effect<void>;
}

export class AuthClient extends ServiceMap.Service<
  AuthClient,
  AuthClientShape
>()("webuntis/AuthClient") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const sessionState = yield* SessionState;
      const metadataState = yield* MetadataState;

      return AuthClient.of({
        ensureAuthenticated: Effect.fn("AuthClient.ensureAuthenticated")(
          function* () {
            return yield* sessionState.ensureAuthenticated();
          },
        ),
        refreshToken: Effect.fn("AuthClient.refreshToken")(function* () {
          return yield* sessionState.refreshToken();
        }),
        clear: Effect.fn("AuthClient.clear")(function* () {
          yield* metadataState.clear();
          yield* sessionState.clear();
        }),
      });
    }),
  );
}
