import { defineConfig } from "tsdown/config";

import { packConfig } from "./pack.config.ts";

// TODO: Remove this adapter and use `vp pack` once Vite+ bundles tsdown >=0.22.7,
// which supports declaration generation with this project's TypeScript 7 toolchain.
export default defineConfig(packConfig);
