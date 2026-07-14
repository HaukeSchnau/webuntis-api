export const packConfig = {
  entry: {
    index: "./src/index.ts",
    schemas: "./src/domains/schemas.ts",
  },
  format: "esm" as const,
  platform: "node" as const,
  target: "node20",
  dts: true,
  sourcemap: true,
  clean: true,
  fixedExtension: false,
  deps: {
    skipNodeModulesBundle: true,
  },
};
