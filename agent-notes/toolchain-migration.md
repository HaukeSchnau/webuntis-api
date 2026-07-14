# pnpm, Vite+, and Nix migration

## Decision

- Use pnpm 11.9.0 for dependency management and lockfile ownership.
- Use Vite+ 0.2.4 for formatting, linting, type checks, and Vitest.
- Use Vite+ packaging with the project's patched TypeScript Go compiler for declaration generation.

## TypeScript 7 packaging

Vite+ 0.2.4 bundles `rolldown-plugin-dts` 0.26.0. Its default declaration path expects the TypeScript 5/6 JavaScript compiler API, while TypeScript 7's native package exposes only version metadata from that API entry point. `pack.dts.tsgo` selects the plugin's native compiler path instead. The project already provides that compiler through `@effect/tsgo`, so Vite+ can package the library without a standalone tsdown dependency. Comparing both build paths showed identical public declarations and JavaScript; only generated chunk hashes and whitespace differed.

## Verification

- `nix flake check --no-build path:.`
- `nix develop path:. --command pnpm install --frozen-lockfile`
- `pnpm peers check`
- `just check`
- `just test` (113 passed, 17 credential-gated tests skipped)
- `just pack-check` (Vite+ build, publint, and ATTW passed)
