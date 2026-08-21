# webuntis-api

Headless WebUntis client built on the Effect v4 beta ecosystem.

This package models the modern WebUntis REST surface as explicit `Context.Service` services. You can consume the aggregate `WebUntisClient`, or depend on focused domain services such as `AppClient`, `MessagesClient`, `SchoolyearsClient`, or `TimetableClient`.

For breaking API changes and upgrade notes, see [MIGRATION.md](./MIGRATION.md).

## What You Get

- Explicit Effect v4 services with two composition roots: `webUntisLayer` for environment-driven wiring and `makeWebUntisLayer(config)` when you already hold a resolved configuration.
- A small aggregate facade through `WebUntisClient` for convenience.
- First-class domain services for `app`, `classreg`, `exams`, `messages`, `profile`, `schoolyears`, `session`, and `timetable`.
- Descriptor-driven request construction, with explicit auth vs metadata header policy.
- Fiber-local school-year scoping for historical data and advertised future years.
- Forward-compatible runtime decoding plus strict contract tests and targeted live probes that expose upstream drift.
- Internal-only reverse-engineering helpers for unstable or raw routes.

## Runtime Model

This package is headless. It does not depend on a browser at runtime.

The current implementation follows the modern WebUntis flow:

1. School discovery via `https://schoolsearch.webuntis.com/schoolquery2`
2. Session bootstrap via `GET /WebUntis/index.do`
3. Credential submission via `POST /WebUntis/j_spring_security_check`
4. Token minting via `GET /WebUntis/api/token/new`
5. Bearer-authenticated requests to `/WebUntis/api/rest/view/...`

The service graph is split into a few distinct layers:

- `ClientConfig` reads and validates `WEBUNTIS_*` config, including URL validation. `ClientConfig.load` goes through the ambient `ConfigProvider`; `ClientConfig.fromEnv` takes an explicit record.
- `SchoolDiscovery` resolves the school deterministically and fails on ambiguous matches.
- `SchoolResolver` caches the resolved tenant target.
- `SessionState` manages cookies, login, token refresh, and auth retries.
- `MetadataState` caches tenant and school-year headers per authenticated session.
- `AuthClient` exposes authentication-specific operations.
- `WebUntisHttp` executes typed request descriptors.
- Domain services expose stable read-only business APIs.

## Development

Enter the reproducible development shell and install the pinned pnpm dependencies:

```bash
nix develop
pnpm install
```

The shell provides Node.js, pnpm, Just, SOPS, and age. Vite+ is installed with the project dependencies and exposes the `vp` command inside the shell.

## Quick Start

The most familiar entry point is still the aggregate `WebUntisClient`.

```ts
import { Effect } from "effect";
import { WebUntisClient, webUntisLayer } from "webuntis-api";

const program = Effect.gen(function* () {
  const client = yield* WebUntisClient;
  const appData = yield* client.app.getData;
  const schoolyears = yield* client.schoolyears.list;

  return {
    school: appData.tenant.displayName,
    schoolyears,
  };
});

await Effect.runPromise(program.pipe(Effect.provide(webUntisLayer)));
```

`webUntisLayer` reads its `WEBUNTIS_*` settings through Effect's ambient `ConfigProvider` when the layer is built, so `ConfigProvider.layer(...)` overrides apply and nothing is read at import time. It fails with `ConfigurationError` if the settings are missing or malformed.

If you already have a configuration value — from a secret store, a test fixture, or your own config schema — use `makeWebUntisLayer` instead:

```ts
import { Effect } from "effect";
import { clientConfigFromEnv, makeWebUntisLayer } from "webuntis-api";

const config = await Effect.runPromise(
  clientConfigFromEnv({ schoolName: "IGS Lilienthal", username: "...", password: "..." }),
);

const layer = makeWebUntisLayer(config);
```

## Preferred v4 Style

For new code, prefer yielding focused services directly. That keeps dependencies explicit and matches the current Effect v4 style better than pushing everything through one large facade.

```ts
import { Effect } from "effect";
import { AppClient, MessagesClient, webUntisLayer } from "webuntis-api";

const program = Effect.gen(function* () {
  const app = yield* AppClient;
  const messages = yield* MessagesClient;

  const [home, inbox] = yield* Effect.all([app.getHome, messages.getInbox]);

  return {
    schoolName: home.schoolName,
    inboxCount: inbox.incomingMessages.length,
  };
});

await Effect.runPromise(program.pipe(Effect.provide(webUntisLayer)));
```

The domain services are especially useful when a program only needs one slice of the API:

```ts
import { Effect } from "effect";
import { TimetableClient, webUntisLayer } from "webuntis-api";

const program = Effect.gen(function* () {
  const timetable = yield* TimetableClient;

  return yield* timetable.getEntries({
    start: "2026-03-23",
    end: "2026-03-27",
    resourceType: "CLASS",
    resources: [1],
  });
});

await Effect.runPromise(program.pipe(Effect.provide(webUntisLayer)));
```

## School-Year Scoping

`withSchoolYear` applies an explicit school-year context to supported timetable, exam, and
class-register reads. The scope is fiber-local, so nested and concurrent historical reads cannot
leak their selected year into one another.

```ts
import { Effect } from "effect";
import { ExamsClient, SchoolyearsClient, withSchoolYear } from "webuntis-api";

const historicalExams = Effect.gen(function* () {
  const exams = yield* ExamsClient;
  const schoolyears = yield* SchoolyearsClient;
  const previous = (yield* schoolyears.list)[1];

  if (previous === undefined) {
    return [];
  }

  return yield* exams
    .list({
      start: previous.dateRange.start,
      end: previous.dateRange.end,
    })
    .pipe(withSchoolYear(previous.id));
});
```

`withSchoolYear` is a plain operator, so it applies to any effect regardless of which service produced
it. Only IDs returned by `schoolyears.list` should be selected. `timetable.search` still requires its
endpoint-specific `schoolyear` query in addition to the scoped request header.

## Public API Shape

The root package exports:

- `WebUntisClient` as the convenience aggregate service
- `AuthClient`
- `AppClient`
- `ClassregClient`
- `ExamsClient`
- `MessagesClient`
- `ProfileClient`
- `SchoolyearsClient`
- `SessionClient`
- `TimetableClient`
- `ClientConfig`
- `clientConfigFromEnv`
- `webUntisLayer` and `makeWebUntisLayer`
- `withSchoolYear`
- `DiscoveryError`, `AuthError`, `TransportError`, `DecodeError`, `InvalidRequestError`, and `ConfigurationError`

Every response type is also exported from the root as a type. Every failure a request can produce is
covered by the `WebUntisError` union.

Schema _values_ live on the dedicated subpath instead of the root barrel:

```ts
import { HomeSchema, TimetableEntriesSchema } from "webuntis-api/schemas";
```

The subpath exports one schema and one matching type per modeled response, including the element
types of collection responses, so a caller can name intermediate values:

```ts
import type { MessageSummary, TimetableEntry } from "webuntis-api";

const subjectOf = (message: MessageSummary) => message.subject;
```

The root package does not export internal raw view helpers, schema values, or public mutating experimental profile routes.

Internal runtime services such as `SchoolDiscovery`, `SchoolResolver`, `SessionState`, `MetadataState`, and `WebUntisHttp` are intentionally kept off the root barrel.

If you need service types for your own signatures, prefer the service-native form:

```ts
import type { AppClient, TimetableClient } from "webuntis-api";

type AppService = AppClient["Service"];
type TimetableService = TimetableClient["Service"];
```

The non-trivial id/filter methods now take request objects instead of positional parameters:

```ts
const exam = yield * exams.getExam({ id: 42 });
const staff = yield * messages.getRecipientFilter({ recipientOption: "STAFF" });
const results =
  yield *
  messages.searchRecipients({
    recipientOption: "STAFF",
    searchText: "anna",
  });
```

## Configuration

The live layer reads these environment variables:

```bash
export WEBUNTIS_SCHOOL_NAME="IGS Lilienthal"
export WEBUNTIS_USERNAME="..."
export WEBUNTIS_PASSWORD="..."
```

Optional overrides:

- `WEBUNTIS_SCHOOL_LOGIN_NAME`
- `WEBUNTIS_SERVER`
- `WEBUNTIS_SERVER_URL`
- `WEBUNTIS_TENANT_ID`
- `WEBUNTIS_DISCOVERY_ENDPOINT`

Notable behavior changes:

- `WEBUNTIS_SERVER_URL` is now validated during config loading.
- School discovery now fails on ambiguous results unless you pin the tenant via `WEBUNTIS_SCHOOL_LOGIN_NAME`, `WEBUNTIS_SERVER`, `WEBUNTIS_SERVER_URL`, or `WEBUNTIS_TENANT_ID`.

## Testing

Run the static checks:

```bash
just lint
```

Run the tests:

```bash
just test
```

Verify the published artifact — `publint`, `attw`, and a real consumer compiled against the packed
tarball under both module-resolution modes with `skipLibCheck: false`:

```bash
just pack-check
just pack-check-engines   # same, on the oldest Node in package.json#engines
```

The test suite is split into:

- `test/unit` for config, session/metadata runtime behavior, discovery, request-construction behavior, and a snapshot that pins the root export surface
- `test/contract` for strict drift detection and positive payload fixtures
- `test/live/smoke.test.ts` for a small credential-gated smoke suite
- `test/live/live.test.ts` for broader live coverage and snapshot drift detection

Without live credentials, the credential-gated tests are skipped and report which `WEBUNTIS_*` variables are missing.

## Encrypted Live Credentials

The repository keeps live-test credentials in an encrypted SOPS file at [`secrets/webuntis-live.env`](./secrets/webuntis-live.env).

SOPS is configured through [`.sops.yaml`](./.sops.yaml) and uses an `age` recipient. Only the public recipient is committed. The matching private key must be available locally at:

```bash
~/.config/sops/age/keys.txt
```

You can override that location with `SOPS_AGE_KEY_FILE`.

If `sops` and `age` are not installed locally, install them with Nix:

```bash
nix shell nixpkgs#sops nixpkgs#age
```

Convenience commands:

```bash
just test-live-sops
just test-live-sops-update
```

To rotate or edit the encrypted live-test credentials:

```bash
sops secrets/webuntis-live.env
```

To decrypt the file manually for inspection without writing plaintext into the repository:

```bash
sops decrypt secrets/webuntis-live.env
```

## Design Notes

- We optimize for broad read-only WebUntis coverage first.
- Stable business routes belong on public domain services.
- Reverse-engineering probes stay internal so the exported package surface remains coherent.
- Snapshot churn in the live suite is treated as evidence of upstream change, not as noise to suppress.
- Request types are derived from the schemas that validate them, so a caller-facing type and its runtime check cannot describe different shapes.
- Entity identifiers decode as integers rather than as arbitrary finite numbers.
- Runtime decoding accepts additive upstream fields while still rejecting missing or malformed known fields. Contract tests and targeted raw live probes apply strict excess-property decoding so additions remain visible to maintainers without breaking consumers. Public-client live snapshots exercise real endpoint behavior but cannot observe fields intentionally stripped by runtime decoding.

Reverse-engineering artifacts live under [`docs/research/webuntis`](./docs/research/webuntis).
