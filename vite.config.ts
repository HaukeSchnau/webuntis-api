import { defineConfig } from "vite-plus";

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
      tsgo: true,
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
    ignorePatterns: ["dist", "node_modules", "test/consumer"],
    tabWidth: 2,
  },
  lint: {
    ignorePatterns: ["dist", "node_modules", "test/consumer"],
    plugins: ["oxc", "typescript"],
    categories: {
      correctness: "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      // Beyond `correctness`: the type-aware rules that keep `any` and
      // redundant assertions out, plus a few mechanical hygiene rules. The
      // wider `pedantic` category is deliberately not enabled — it is dominated
      // by `prefer-readonly-parameter-types`, which fires on every callback.
      "typescript/no-explicit-any": "error",
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
    },
  },
});
