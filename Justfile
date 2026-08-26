default:
    @just --list

build:
    pnpm run build

pack-check:
    pnpm run pack-check

qa:
    pnpm run qa

packed-live: build
    ./scripts/check-packed-consumer.sh --live

# Runs the packed consumer against the oldest Node this package claims to support.
pack-check-engines: build
    NODE_BIN="$(nix build --no-link --print-out-paths nixpkgs#nodejs_22)/bin/node" \
        ./scripts/check-packed-consumer.sh

test:
    pnpm run test

test-unit:
    pnpm exec vp test run test/unit

test-contract:
    pnpm exec vp test run test/contract

test-live:
    pnpm exec vp test run test/live

test-live-sops:
    ./scripts/run-live-tests.sh

test-live-sops-update:
    ./scripts/run-live-tests.sh -u

test-watch:
    pnpm exec vp test

lint:
    pnpm run lint

format:
    pnpm exec vp fmt . --write

format-check:
    pnpm exec vp fmt --check

check:
    pnpm exec vp check
