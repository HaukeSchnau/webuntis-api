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
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-readable-spacing": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",
      "anti-slop-effect/no-manual-effect-error-tag": "error",
      "anti-slop-effect/no-manual-tagged-construction": "error",
      "typescript/switch-exhaustiveness-check": "error",

      // It can't tell an entry point or a test from library code, and 57 of its findings are tests
      // that provide their layers.
      // https://github.com/Effect-TS/tsgo/blob/main/docs/rules/strict-effect-provide.md
      "effecttsgo/strict-effect-provide": "off",

      // A service key is the string Effect looks the service up by and a literal type in the published
      // declarations, so renaming the 17 findings (`webuntis/...`) would break consumers.
      // https://github.com/Effect-TS/tsgo/blob/main/docs/rules/deterministic-keys.md
      "effecttsgo/deterministic-keys": "off",

      // It treats every exported fixed-arity function as an Effect-style `self` API and asks for dual
      // overloads on 20 internal helpers.
      // https://github.com/Effect-TS/tsgo/blob/main/docs/rules/missing-pipeable-signature.md
      "effecttsgo/missing-pipeable-signature": "off",

      // A brand changes the public error classes' types and rejects the structural fakes consumers
      // may build in tests, so it waits for a breaking release. 10 findings, all in errors.ts.
      // https://github.com/Effect-TS/tsgo/blob/main/docs/rules/schema-class-missing-brand.md
      "effecttsgo/schema-class-missing-brand": "off",

      // `Shape` is the name of a service's interface (`Context.Service<Self, Shape>`), and
      // `WebUntisClientShape` is public API. Renaming the 37 findings would break consumers.
      // https://github.com/dmmulroy/anti-slop/blob/63dbb09/src/rules/no-shape-in-symbol-names.ts
      "anti-slop/no-shape-in-symbol-names": "off",

      // Every domain client builds its operations from WebUntisHttp with `makeOperations`, and the
      // core layer comes from `makeWebUntisCoreLayer`. Making each a service of its own is a
      // redesign of the client's layering. 11 findings.
      // https://github.com/dmmulroy/anti-slop/blob/63dbb09/src/effect/rules/no-service-constructor-imports.ts
      "anti-slop-effect/no-service-constructor-imports": "off",

      // The public API takes a school as its name or its target, and a request path as a string or a
      // function of the input; `typeof` tells them apart. 15 findings, 5 of them in src.
      // https://github.com/dmmulroy/anti-slop/blob/63dbb09/src/rules/no-runtime-typeof.ts
      "anti-slop/no-runtime-typeof": "off",

      // The flagged parameters are the boundary: a decoder takes parsed JSON, an error mapper takes
      // whatever a foreign API failed with, and the live tests' snapshot normalizer walks any JSON.
      // 9 and 3 findings.
      // https://github.com/dmmulroy/anti-slop/blob/63dbb09/src/rules/no-unknown-parameters.ts
      "anti-slop/no-unknown-parameters": "off",
      // https://github.com/dmmulroy/anti-slop/blob/63dbb09/src/rules/no-unknown-returns.ts
      "anti-slop/no-unknown-returns": "off",

      // A `switch` on `_tag` with `typescript/switch-exhaustiveness-check` is exhaustive without a
      // runtime `Match` call. 6 findings.
      // https://github.com/dmmulroy/anti-slop/blob/63dbb09/src/effect/rules/no-manual-tag-comparison.ts
      "anti-slop-effect/no-manual-tag-comparison": "off",
      // https://github.com/dmmulroy/anti-slop/blob/63dbb09/src/effect/rules/prefer-effect-match.ts
      "anti-slop-effect/prefer-effect-match": "off",

      // Reusing a precise name in a nested callback reads better, and TypeScript resolves the scopes.
      // 22 findings, 21 of them the live tests' `it`.
      // https://oxc.rs/docs/guide/usage/linter/rules/eslint/no-shadow.html
      "eslint/no-shadow": "off",

      // Effect's tagged unions expose `_tag`. 7 findings.
      // https://oxc.rs/docs/guide/usage/linter/rules/eslint/no-underscore-dangle.html
      "eslint/no-underscore-dangle": "off",

      // It misreads an exhaustive `switch` whose every case returns; `noImplicitReturns` covers
      // missing returns. 1 finding.
      // https://oxc.rs/docs/guide/usage/linter/rules/typescript/consistent-return.html
      "typescript/consistent-return": "off",
    },
  },
});
