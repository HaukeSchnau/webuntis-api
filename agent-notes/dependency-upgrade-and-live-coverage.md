# Dependency Upgrade and Live Coverage

## Active goal

Upgrade every package to its latest appropriate published version, repair all regressions, verify the complete local and live API suites, then inspect the authenticated WebUntis app read-only for missing routes and loose schemas.

## Constraints and assumptions

- Never invoke a server-state-changing route except authentication/session bootstrap.
- Treat "latest" as the latest stable release unless the project intentionally follows a prerelease channel (Effect v4 and TypeScript native preview).
- Preserve the package's Effect v4 architecture and strict, evidence-driven schema policy.
- Use upstream source/docs under `~/context` plus current official changelogs and package metadata.
- Replace the obsolete `@typescript/native-preview` backend with stable `typescript` 7: `@effect/tsgo` 0.21 only resolves `typescript` or an explicit `@typescript/native` alias.

## Workstreams

- [x] Dependency inventory and upstream migration research
- [x] Manifest/lockfile upgrade
- [x] Static, unit, contract, build, and package verification
- [x] SOPS-backed live API verification
- [x] Authenticated browser route/network exploration
- [x] Evidence-backed route/schema additions
- [x] Full regression verification

## Current status

- Repository started clean at `main` (`chore: move package scripts to just`).
- Existing research includes a 2026-05-05 blind-spot report and runtime route map.
- Live credentials are expected through the encrypted SOPS workflow in `scripts/run-live-tests.sh`.
- Upgraded direct packages; migrated the removed `@typescript/native-preview` backend to stable `typescript` 7.
- Live browser evidence on 2026-07-14 shows no active school year. `app/data.currentSchoolYear` and mobile `schoolYear` are `null`; the SPA omits the school-year header in this state even though auth-only `timegrid` still describes the most recent grid.
- Live Vitest files must run sequentially because concurrent login sessions for the same account produce intermittent 401 responses.
- Current bundle comparison found the same 254 literal modern REST routes as the March catalog; the live exploration report is in `docs/research/webuntis/read-only-blind-spots-2026-07-14.md`.
- 2026-08-12 dependency refresh: all direct packages are current, Effect and `@effect/vitest` are aligned at `4.0.0-rc.108`, and the source now uses the RC rename `Schema.TaggedError`.

## Verification log

- Formatting, Oxc lint/type diagnostics, unit tests (35), and contract tests (66) pass after the first repair pass.
- Build, publint, and are-the-types-wrong passed on the upgraded stack.
- Live update run passes all 17 executable tests and refreshed the inactive-year snapshots; one inverse credential-documentation test is intentionally skipped when credentials exist.
- Final non-update verification passed: format check, Oxc lint/type diagnostics, 104 local tests (15 live skips without injected credentials), build, publint, are-the-types-wrong, and 17 live tests (one inverse environment test skipped).
- `bun outdated` reports no outdated direct dependencies.
- Historical-year expansion verification passed: formatting, Oxc lint/type diagnostics, 113 local tests, build, publint, are-the-types-wrong, and 19 live tests across every advertised school year (one inverse environment test skipped).
- The non-empty historical timetable regression exposed and now covers nullable position-resource `displayNameLabel` values.
- The 2026-08-12 refresh passes format, lint/type diagnostics, 122 local tests, build, publint, and packed-consumer checks. The authenticated live suite reached WebUntis but found unrelated snapshot drift: the `Lehrkräfte` recipient count changed from 128 to 134.

## Follow-up opportunities

- Effect and `@effect/vitest` must stay aligned at RC 108; `@effect/tsgo` 0.36.4 patches stable TypeScript 7.0.2.
- Refresh the live recipient-quickfilter snapshot in a separate data-update change after confirming the staff-count increase is expected.
- [x] Add fiber-local historical school-year selection for verified year-aware routes.
- [x] Expose the confirmed read-only `exams/for-class` buckets.
- [x] Tighten the stable timetable-entry core from 1,755 historical entries.
- `countPerGrade` remains loose because all 352 historical statistics rows exposed an empty array.
- Repeat timetable/date-dependent browser exploration after a new school year becomes active.
- Capture non-empty class-exam buckets and exam `countPerGrade` values before tightening them.
