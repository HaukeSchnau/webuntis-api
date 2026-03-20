import { Effect, Layer, ServiceMap } from "effect";
import { Bootstrap } from "./internal/bootstrap.ts";
import type {
  AuthError,
  DecodeError,
  DiscoveryError,
  TransportError,
} from "./internal/errors.ts";
import type { AuthenticatedState } from "./internal/types.ts";

export interface AuthClientShape {
  readonly ensureAuthenticated: Effect.Effect<
    AuthenticatedState,
    DiscoveryError | AuthError | TransportError | DecodeError
  >;
  readonly refreshToken: Effect.Effect<
    string,
    DiscoveryError | AuthError | TransportError
  >;
  readonly clear: Effect.Effect<void>;
}

export class AuthClient extends ServiceMap.Service<
  AuthClient,
  AuthClientShape
>()("webuntis/AuthClient") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const bootstrap = yield* Bootstrap;

      return AuthClient.of({
        ensureAuthenticated: bootstrap.ensureAuthenticated,
        refreshToken: bootstrap.refreshToken,
        clear: bootstrap.clear,
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}
