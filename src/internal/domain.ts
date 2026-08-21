import { Effect, type Schema } from "effect";
import type { WebUntisError } from "./errors.ts";
import type { WebUntisHttp } from "./http.ts";
import type { SchemaRequestDescriptor } from "./request.ts";

/**
 * Builds the operation shapes every domain service is assembled from.
 *
 * Domain service interfaces stay hand-written (see ADR 0003) — this only removes
 * the mechanical body that would otherwise be repeated per endpoint, and derives
 * span names from the owning service so they cannot drift from the method they
 * describe.
 */
export const makeOperations = (http: WebUntisHttp["Service"], clientName: string) => {
  const span = (operation: string) => `${clientName}.${operation}`;

  return {
    /** Endpoint that takes no caller input, exposed as a ready-to-yield Effect. */
    read: <S extends Schema.Top>(
      operation: string,
      descriptor: SchemaRequestDescriptor<void, S>,
    ): Effect.Effect<S["Type"], WebUntisError, S["DecodingServices"]> =>
      http.requestSchema(descriptor, undefined).pipe(Effect.withSpan(span(operation))),

    /** Endpoint that requires caller input. */
    call: <Input, S extends Schema.Top>(
      operation: string,
      descriptor: SchemaRequestDescriptor<Input, S>,
    ) =>
      Effect.fn(span(operation))(function* (input: Input) {
        return yield* http.requestSchema(descriptor, input);
      }),

    /** Endpoint whose input may be omitted, in which case `fallback` is sent. */
    callOptional: <Input, S extends Schema.Top>(
      operation: string,
      descriptor: SchemaRequestDescriptor<Input, S>,
      fallback: Input,
    ) =>
      Effect.fn(span(operation))(function* (input: Input = fallback) {
        return yield* http.requestSchema(descriptor, input);
      }),
  };
};
