# pnpm, Vite+, and Nix migration

## Decision

- Use pnpm 11.21.0 for dependency management and lockfile ownership.
- Use Vite+ 0.2.9 for formatting, linting, type checks, and Vitest.
- Use Vite+ packaging with the project's patched TypeScript Go compiler for declaration generation.

## TypeScript 7 packaging

`pack.dts.tsgo` selects Vite+'s native TypeScript declaration path. The project provides that compiler through `@effect/tsgo` 0.36.4, which patches TypeScript 7.0.2, so the package can emit declarations without relying on the JavaScript compiler API. This remains verified with Vite+ 0.2.9.

## Verification

- `nix flake check --no-build path:.`
- `nix develop path:. --command pnpm install --frozen-lockfile`
- `pnpm peers check`
- `just check`
- `just test` (113 passed, 17 credential-gated tests skipped)
- `just pack-check` (Vite+ build, publint, and ATTW passed)
