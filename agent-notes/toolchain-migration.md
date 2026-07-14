# pnpm, Vite+, and Nix migration

## Decision

- Use pnpm 11.9.0 for dependency management and lockfile ownership.
- Use Vite+ 0.2.4 for formatting, linting, type checks, and Vitest.
- Keep packaging options in `pack.config.ts`, shared by Vite+ and a temporary standalone tsdown adapter.

## Compatibility constraint

Vite+ 0.2.4 bundles tsdown 0.22.3. Its declaration plugin crashes against this project's Effect-patched TypeScript 7 compiler while reading `useCaseSensitiveFileNames`. Standalone tsdown 0.22.7 works. Remove `tsdown.config.ts` and switch `just build` to `vp pack` once Vite+ bundles tsdown 0.22.7 or newer and the package build passes.

## Verification

- `nix flake check --no-build path:.`
- `nix develop path:. --command pnpm install --frozen-lockfile`
- `pnpm peers check`
- `just check`
- `just test` (113 passed, 17 credential-gated tests skipped)
- `just pack-check` (build, publint, and ATTW passed)
