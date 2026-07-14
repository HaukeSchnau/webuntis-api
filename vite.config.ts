import { defineConfig } from "vite-plus";

import { packConfig } from "./pack.config.ts";

export default defineConfig({
  pack: packConfig,
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
  fmt: {
    ignorePatterns: ["dist", "node_modules"],
    tabWidth: 2,
  },
  lint: {
    ignorePatterns: ["dist", "node_modules"],
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
