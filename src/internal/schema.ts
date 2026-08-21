import { Schema } from "effect";
import type { ParseOptions } from "effect/SchemaAST";

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
