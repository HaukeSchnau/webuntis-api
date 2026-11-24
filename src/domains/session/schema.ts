import { Schema } from "effect";

export const SessionStatusSchema = Schema.Struct({
  expiresInMs: Schema.Int,
});

export type SessionStatus = typeof SessionStatusSchema.Type;
