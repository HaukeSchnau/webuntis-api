import { defineConfig } from "tsdown/config";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    schemas: "./src/domains/schemas.ts",
  },
  format: "esm",
  platform: "node",
  target: "node20",
  dts: true,
  sourcemap: true,
  clean: true,
  fixedExtension: false,
  deps: {
    skipNodeModulesBundle: true,
  },
});
