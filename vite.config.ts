import { antipattern, correctness, style } from "@effect/tsgo/oxlint-presets";
import { createRequire } from "node:module";
import path from "node:path";
import { defineConfig } from "vite-plus";

const tsrsPackage = createRequire(import.meta.url).resolve("tsrs/package.json");

const effectRules = Object.fromEntries(
  [correctness, antipattern, style].flatMap((preset) =>
    Object.keys(preset.rules ?? {}).map((rule) => [rule, "error"] as const),
  ),
);

const agentTooling = [
  ".agent/**",
  ".agents/**",
  ".claude/**",
  ".codex/**",
  ".continue/**",
  ".cursor/**",
  ".gemini/**",
  ".opencode/**",
  ".pi/**",
  ".roo/**",
  ".windsurf/**",
];

// Vendored as upstream wrote it, so the next re-vendor is a plain copy.
const antiSlop = "tools/oxlint/anti-slop/**";

export default defineConfig({
  pack: {
    entry: {
      index: "./src/index.ts",
      schemas: "./src/domains/schemas.ts",
    },
    format: "esm",
    platform: "node",
    target: "node22",
    dts: {
      // The tsdown that Vite+ 1.8 bundles has no "tsrs" generator. Its "tsgo" generator runs any
      // tsc 7 CLI, so it runs tsrs. Switch to `generator: "tsrs"` once Vite+ bundles one that has it.
      generator: "tsgo",
      tsgo: { path: path.join(path.dirname(tsrsPackage), "bin/tsrs") },
      sourcemap: true,
    },
    sourcemap: true,
    clean: true,
    fixedExtension: false,
    deps: {
      neverBundle: true,
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
  fmt: {
    ignorePatterns: ["dist", "node_modules", "test/consumer", ...agentTooling, antiSlop],
    sortPackageJson: {},
  },
  lint: {
    ignorePatterns: [
      "dist",
      "node_modules",
      "test/consumer",
      // Calder's own TypeScript project, whose tsconfig package `calder gen` links in locally.
      ".calder",
      ...agentTooling,
      antiSlop,
    ],
    plugins: ["effecttsgo", "eslint", "oxc", "typescript", "unicorn"],
    categories: {
      correctness: "error",
      perf: "error",
      suspicious: "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
      { name: "anti-slop-effect", specifier: "./tools/oxlint/anti-slop/effect/index.ts" },
    ],
    rules: {
      ...effectRules,

      "vite-plus/prefer-vite-plus-imports": "error",

      "eslint/eqeqeq": "error",
      "typescript/consistent-type-imports": "error",
      "typescript/no-explicit-any": "error",
      "typescript/no-non-null-assertion": "error",
      "unicorn/prefer-node-protocol": "error",

      // The type-aware rules that keep `any` and redundant assertions out, plus a few mechanical
      // hygiene rules. The `pedantic` category stays off: `prefer-readonly-parameter-types` would
      // fire on every callback.
      "typescript/no-unsafe-argument": "error",
      "typescript/no-unsafe-assignment": "error",
      "typescript/no-unsafe-call": "error",
      "typescript/no-unsafe-member-access": "error",
      "typescript/no-unsafe-return": "error",
      "typescript/no-unnecessary-type-arguments": "error",
      "typescript/no-unnecessary-type-assertion": "error",
      "typescript/no-unsafe-type-assertion": "error",
      "typescript/strict-boolean-expressions": "error",
      "eslint/require-unicode-regexp": "error",
      "eslint/no-negated-condition": "error",

      "oxc/no-accumulating-spread": "error",
      "anti-slop/no-array-filter-map": "error",
      "anti-slop/no-reduce-accumulator-copy": "error",
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-known-value-widening": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",
      "anti-slop/no-runtime-typeof": "error",
      "anti-slop/no-shape-in-symbol-names": "error",
      "anti-slop/no-unknown-parameters": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-readable-spacing": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",
      "anti-slop-effect/no-manual-effect-error-tag": "error",
      "anti-slop-effect/no-manual-tag-comparison": "error",
      "anti-slop-effect/no-manual-tagged-construction": "error",
      "anti-slop-effect/no-service-constructor-imports": "error",
      "anti-slop-effect/prefer-effect-match": "error",
    },
  },
});
