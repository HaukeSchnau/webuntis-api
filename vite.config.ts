import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "./src/index.ts",
      schemas: "./src/domains/schemas.ts",
    },
    format: "esm",
    platform: "node",
    target: "node20",
    dts: {
      tsgo: true,
      sourcemap: true,
    },
    sourcemap: true,
    clean: true,
    fixedExtension: false,
    deps: {
      skipNodeModulesBundle: true,
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
    },
  },
});
