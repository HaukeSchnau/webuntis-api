import { Effect, Layer, Ref, ServiceMap } from "effect";
import type { SessionState } from "./types.ts";
import { emptySessionState } from "./types.ts";

export interface SessionStore {
  readonly get: Effect.Effect<SessionState>;
  readonly set: (state: SessionState) => Effect.Effect<void>;
  readonly update: (f: (state: SessionState) => SessionState) => Effect.Effect<void>;
  readonly clear: Effect.Effect<void>;
}

export const SessionStore = ServiceMap.Service<SessionStore, SessionStore>("webuntis/SessionStore");

export const inMemory = Layer.effect(SessionStore)(
  Effect.gen(function*() {
    const ref = yield* Ref.make(emptySessionState());

    return {
      get: Ref.get(ref),
      set: (state) => Ref.set(ref, state),
      update: (f) => Ref.update(ref, f),
      clear: Ref.set(ref, emptySessionState())
    } satisfies SessionStore;
  })
);
