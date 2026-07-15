import { Schema } from "effect";

export const SessionStatusSchema = Schema.Struct({
  expiresInMs: Schema.Finite,
});

export type SessionStatus = Schema.Schema.Type<typeof SessionStatusSchema>;
