default:
    @just --list

build:
    pnpm exec vp pack

pack-check: build
    pnpm exec publint --strict
    pnpm exec attw --pack . --profile esm-only
    ./scripts/check-packed-consumer.sh

packed-live: build
    ./scripts/check-packed-consumer.sh --live

test:
    pnpm exec vp test run

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
    pnpm exec vp lint

format:
    pnpm exec vp fmt . --write

format-check:
    pnpm exec vp fmt --check

check:
    pnpm exec vp check
