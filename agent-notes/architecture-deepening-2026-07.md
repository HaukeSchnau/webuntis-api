# Architecture deepening — July 2026

## Active goal

Implement all actionable findings from the 2026-07-15 architecture/public-interface/Effect v4 audit, preserve verified WebUntis behavior, and prove the packed package and credential-backed live client work end to end.

## Scope and decisions

- Fix auth-only tenant-header retry and stale concurrent-401 invalidation.
- Keep session generations monotonic; stale responses may not clear newer session state.
- Production decoding ignores additive fields but still rejects missing/wrong known fields.
- Strict excess-property decoding remains in contract/live drift verification.
- Keep explicit domain interfaces; do not generate the public client with mapped-type machinery.
- Request descriptors remain the one home for route mechanics and gain caller-input validation.
- Preserve ergonomic string/number inputs; validate at the seam instead of exposing branded types.
- Keep the raw research adapter internal and minimal; public and research adapters share one runtime graph.
- Public auth must not return session caches or plaintext bearer tokens.
- Effect remains the caller-visible runtime identity and will be a peer plus development dependency.
- `CONTEXT.md` and ADRs will record the domain/state/decode decisions.

## Work packets

### P1 — Runtime decode policy

- Owner: main agent
- Files: `src/internal/schema.ts`, `src/internal/discovery.ts`, focused tests
- Dependencies: none
- Invariants: strict drift visibility remains; known-field failures remain typed
- Checks: unit discovery/config tests, contract tests

### P2 — Session and retry correctness

- Owner: main agent
- Files: `src/internal/session-state.ts`, `metadata-state.ts`, `types.ts`, `http.ts`, `test/unit/bootstrap.test.ts`
- Dependencies: P1
- Invariants: one retry only; single-flight login; monotonic generation; tenant/year headers correct
- Checks: deterministic tenant retry and concurrent stale-401 tests, unit suite

### P3 — Domain Effect and schema cleanup

- Owner: domain worker
- Files: `src/domains/**`
- Dependencies: none; preserve `WebUntisHttp.requestSchema`
- Invariants: route paths/policies/defaults/output types unchanged; explicit domain interfaces remain
- Checks: lint/typecheck; main agent updates integrated call sites

### P4 — Transport seam and composition root

- Owner: main agent
- Files: `src/internal/http.ts`, `request.ts`, `raw-view-api.ts`, `runtime.ts`, `client.ts`, test helpers/live wiring
- Dependencies: P2
- Invariants: descriptor-only production path; research reads remain possible; one shared cookie/session graph
- Checks: request construction, shared-bootstrap counter test, live smoke

### P5 — Request validation and public contract

- Owner: main agent
- Files: request descriptors, errors/config/auth/root exports/schema barrel/public tests
- Dependencies: P2, P3
- Invariants: plain caller inputs remain ergonomic; invalid inputs fail before transport; no token/cache leakage
- Checks: invalid date/range/resource/id/URL tests; published declaration checks

### P6 — Package, docs, consumer verification

- Owner: docs/package worker after P3/P5
- Files: `package.json`, lockfile, README, migration guide, examples/consumer fixtures, Justfile/Vite config as needed
- Dependencies: P5
- Invariants: ESM packaging; Effect beta.98 compatibility; examples match actual interface
- Checks: packed fixture typecheck and execution, build, publint, ATTW

### P7 — Independent review and simplification

- Owner: read-only reviewer subagent; fixes by main agent only
- Dependencies: P1–P6
- Checks: targeted checks after accepted fixes

## Verification matrix

- Formatting: `just format-check`
- Static: `just lint`, `just check`
- Local behavior: `just test-unit`, `just test-contract`, `just test`
- Package: `just build`, `just pack-check`, packed consumer fixture
- Live source suite: `just test-live-sops` without snapshot updates
- Packed live smoke: authentication + app data + representative read
- VCS: `jj diff --check`, `jj status`, clean atomic change description

## Current status

- [x] Audit and three-way decomposition completed
- [x] Jujutsu working change created
- [x] P1 runtime decode policy
- [x] P2 session/retry correctness
- [x] P3 domain Effect/schema cleanup
- [x] P4 transport/composition
- [x] P5 request/public contract
- [x] P6 package/docs/consumer
- [x] P7 independent review
- [x] Full local/package/live verification

## Progress log

- Production decoders use additive-field-tolerant parse options; strict drift options remain unchanged for contract/live probes.
- Discovery IDs and token fallback/freshness use Effect Clock; the prior `Date.now` monkeypatch test now uses TestClock.
- Session invalidation is generation-aware and preserves monotonic generations.
- Initial and retried requests share the same tenant-aware state resolver.
- Deterministic regressions cover additive fields, auth-only tenant retry, and a stale concurrent 401 arriving after a newer login.
- `WebUntisHttp` now exposes only descriptor `request`, `requestJson`, and `requestSchema` operations.
- The raw research adapter now exposes only its actually used JSON GET capability.
- Public, research, and internal test adapters are composed from one shared core-layer instance.
- Domain zero-argument reads are readonly Effects; response numeric schemas use `Schema.Finite`.
- Caller input schemas now reject malformed dates/ranges, non-positive IDs, empty resources, and invalid endpoint discriminants before transport.
- Public auth exposes completion only; public schemas and root types are explicitly curated.
- Effect is a peer and development dependency; the packed tarball passes publint, ATTW, fresh-consumer typechecking, and execution.
- `CONTEXT.md` and three ADRs record session, decode, and endpoint-boundary decisions.
- Effect language-service diagnostics are silent after replacing immediately invoked `Effect.fn` values with traced Effects.
- Integrated unit and contract tests pass (50/50 and 67/67).
- Full local suite passes (120 tests; 17 credential-gated tests skipped in the non-live run).
- Credential-backed source suite passes against WebUntis (19 passed; one intentionally unavailable endpoint skipped).
- Freshly installed packed tarball authenticates and reads live app data plus three school years.
- Independent review found no P0s; all P1/P2 findings were addressed, including bounded metadata-bootstrap retry, stronger public input types, complete cited descriptor validation, shipped declaration maps, response draining, and full declaration checking in the consumer fixture.
- Post-review verification: 122 local tests pass; source live remains 19 passed/1 intentional skip; packed live remains green with three school years.
- The reviewer re-checked all accepted fixes and signed off with no remaining blockers. Metadata bootstrap has direct success-after-one-retry and failure-after-one-retry coverage.

## Known live constraint

Live files must run sequentially because WebUntis can invalidate an earlier login for the same account. Never update snapshots merely to make verification pass; inspect any drift first.

## Historical live-data follow-up

- The tenant currently advertises no active school year, so unscoped exam and class-register reads returned structurally valid empty collections.
- A credential-backed probe confirmed school year 2025/2026 contains 352 exams, 1,358 homework items, and 44 classes.
- School-year-sensitive live tests now locate the advertised year containing 2026-03-16, apply fiber-local school-year scope, and assert non-empty exams, homework, metadata, filters, and timetable entries.
- Large live collections are asserted by count and represented by bounded snapshots; the generated live snapshot file was reduced from roughly 31,000 to 5,200 lines.
