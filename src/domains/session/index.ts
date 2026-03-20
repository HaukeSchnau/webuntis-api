import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import type { SessionStatus } from "../schemas/session.ts";
import { SessionRequests, type SessionStatusRequest } from "./requests.ts";

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
        getStatus: (request = {}) =>
          http.requestSchema(SessionRequests.getStatus, request),
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}

export type { SessionStatusRequest } from "./requests.ts";
