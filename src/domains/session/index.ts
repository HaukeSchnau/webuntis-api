import { Context, Effect, Layer } from "effect";
import { makeOperations } from "../../internal/domain.ts";
import type { WebUntisError } from "../../internal/errors.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import { SessionRequests, type SessionStatusRequest } from "./requests.ts";
import type { SessionStatus } from "./schema.ts";

export interface SessionClientShape {
  readonly getStatus: (
    request?: SessionStatusRequest,
  ) => Effect.Effect<SessionStatus, WebUntisError>;
}

export class SessionClient extends Context.Service<SessionClient, SessionClientShape>()(
  "webuntis/SessionClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { callOptional } = makeOperations(yield* WebUntisHttp, "SessionClient");

      return SessionClient.of({
        getStatus: callOptional("getStatus", SessionRequests.getStatus, {}),
      });
    }),
  );
}

export type { SessionStatusRequest };
