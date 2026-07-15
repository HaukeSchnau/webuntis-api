import type { ParseOptions } from "effect/SchemaAST";

export const runtimeJsonParseOptions = {
  errors: "all",
} satisfies ParseOptions;

export const strictJsonParseOptions = {
  onExcessProperty: "error",
  errors: "all",
} satisfies ParseOptions;
