import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import { SessionRequests, type SessionStatusRequest } from "./requests.ts";
import type { SessionStatus } from "./schema.ts";

export interface SessionClientShape {
  readonly getStatus: (
    request?: SessionStatusRequest,
  ) => Effect.Effect<SessionStatus, RequestFailure>;
}

export class SessionClient extends ServiceMap.Service<
  SessionClient,
  SessionClientShape
>()("webuntis/SessionClient") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return SessionClient.of({
        getStatus: Effect.fn("SessionClient.getStatus")(function* (
          request: SessionStatusRequest = {},
        ) {
          return yield* http.requestSchema(SessionRequests.getStatus, request);
        }),
      });
    }),
  );
}

export type { SessionStatusRequest } from "./requests.ts";
