import { Effect, Schema } from "effect";
import type { ParseOptions } from "effect/SchemaAST";
import { decodeError } from "./errors.ts";

export const runtimeJsonParseOptions = {
  errors: "all",
} satisfies ParseOptions;

export const strictJsonParseOptions = {
  onExcessProperty: "error",
  errors: "all",
} satisfies ParseOptions;

/**
 * Identifier of a WebUntis entity. Integral rather than merely finite, so a
 * malformed id fails decoding instead of entering the domain model as a float.
 */
export const EntityId = Schema.Int;

/** Decodes a parsed JSON response with the runtime policy, reporting `path` on failure. */
export const decodeResponse =
  <S extends Schema.Top>(schema: S, path: string) =>
  (json: unknown) =>
    Schema.decodeUnknownEffect(schema)(json, runtimeJsonParseOptions).pipe(
      Effect.mapError((error) => decodeError(path, error)),
    );
