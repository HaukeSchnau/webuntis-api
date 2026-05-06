default:
    @just --list

build:
    bun run tsdown

pack-check: build
    bun run publint --strict
    bun run attw --pack . --profile esm-only

test:
    bun run vitest run

test-unit:
    bun run vitest run test/unit

test-contract:
    bun run vitest run test/contract

test-live:
    bun run vitest run test/live

test-live-sops:
    ./scripts/run-live-tests.sh

test-live-sops-update:
    ./scripts/run-live-tests.sh -u

test-watch:
    bun run vitest

lint:
    bun run oxlint .

format:
    bun run oxfmt --write .

format-check:
    bun run oxfmt --check .
