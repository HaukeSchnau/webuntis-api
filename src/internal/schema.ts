import type { ParseOptions } from "effect/SchemaAST";

export const strictJsonParseOptions = {
  onExcessProperty: "error",
  errors: "all",
} satisfies ParseOptions;
