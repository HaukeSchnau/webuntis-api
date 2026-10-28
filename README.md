# webuntis-api

Headless WebUntis client built on Effect 4.

This package models the modern WebUntis REST surface as explicit `Context.Service` services. You can consume the aggregate `WebUntisClient`, or depend on focused domain services such as `AppClient`, `MessagesClient`, `SchoolyearsClient`, or `TimetableClient`.

For breaking API changes and upgrade notes, see [MIGRATION.md](./MIGRATION.md).

## What You Get

- Connections built from plain values: `webUntisLayer({ school, credential })` gives one school and account its own session, so several can run in one process.
- Public school search through `searchSchools`.
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

Step 1 only runs when a connection names its school instead of pinning it.

The service graph is split into a few distinct layers, built once per connection:

- `Connection` holds the school and credential the layer was built for, and rejects a pinned server URL that cannot address WebUntis.
- `SchoolResolver` turns the connection's school into a request target, searching by name at most once.
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

A connection is a plain value: the school and the credential to log in with.
`webUntisLayer` turns it into every service of the package. The layer takes its
`HttpClient` from context; provide `FetchHttpClient.layer`, whose
`redirect: "manual"` support the login relies on.

```ts
import { Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import { Credential, WebUntisClient, webUntisLayer } from "@schnau/webuntis-api";

const WebUntis = webUntisLayer({
  school: { loginName: "igs-lilienthal", serverUrl: "igs-lilienthal.webuntis.com" },
  credential: Credential.Password({ username: "jane", password: Redacted.make("secret") }),
}).pipe(Layer.provide(FetchHttpClient.layer));

const program = Effect.gen(function* () {
  const client = yield* WebUntisClient;
  const appData = yield* client.app.getData;
  const schoolyears = yield* client.schoolyears.list;

  return {
    school: appData.tenant.displayName,
    schoolyears,
  };
});

await Effect.runPromise(program.pipe(Effect.provide(WebUntis)));
```

## Connections

`school` is either a `SchoolTarget` (`loginName`, `serverUrl`, optional `tenantId`) or a
school name. A name is looked up through school search when the connection first logs in and
must match exactly one school. `serverUrl` accepts a bare host or any URL on the school's
WebUntis server. Building the layer fails with `ConfigurationError` if a pinned `serverUrl`
cannot address WebUntis.

`credential` is a `Credential` tagged union. `Credential.Password({ username, password })` is
the only variant today; the union leaves room for other WebUntis login methods.

### School search

`searchSchools(query)` searches WebUntis' public school directory without an account. Every
`School` it returns is a valid `SchoolTarget`, so you can store a result and pass it back as a
connection's `school`:

```ts
import { Effect } from "effect";
import { FetchHttpClient } from "effect/http";
import { searchSchools } from "@schnau/webuntis-api";

const schools = await Effect.runPromise(
  searchSchools("Lilienthal").pipe(Effect.provide(FetchHttpClient.layer)),
);
```

### From the environment

Nothing reads `process.env` implicitly. `WebUntisConnection.fromEnv` is a `Config` that reads
one connection through the current `ConfigProvider`, which is the process environment unless
you install another:

```ts
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { WebUntisConnection, webUntisLayer } from "@schnau/webuntis-api";

const WebUntis = Layer.unwrap(Effect.map(WebUntisConnection.fromEnv, webUntisLayer)).pipe(
  Layer.provide(FetchHttpClient.layer),
);
```

It reads `WEBUNTIS_USERNAME` and `WEBUNTIS_PASSWORD`. `WEBUNTIS_SCHOOL_LOGIN_NAME` together
with `WEBUNTIS_SERVER_URL` (plus an optional `WEBUNTIS_TENANT_ID`) pin the school; without
them, `WEBUNTIS_SCHOOL_NAME` is looked up through school search.

### Several schools and accounts

Each `webUntisLayer` call builds an independent client with its own cookies, session, and
caches. To serve many schools from one process, key the layers with Effect's `LayerMap`, which
builds each connection once and shares it between the effects that use it:

```ts
import { Effect, Layer, LayerMap } from "effect";
import { FetchHttpClient } from "effect/http";
import { SchoolyearsClient, webUntisLayer, type WebUntisConnection } from "@schnau/webuntis-api";

declare const connectionFor: (schoolId: string) => WebUntisConnection;

class Schools extends LayerMap.Service<Schools>()("Schools", {
  lookup: (schoolId: string) => webUntisLayer(connectionFor(schoolId)),
  dependencies: [FetchHttpClient.layer],
  idleTimeToLive: "10 minutes",
}) {}

const years = (schoolId: string) =>
  SchoolyearsClient.use((client) => client.list).pipe(Effect.provide(Schools.get(schoolId)));
```

WebUntis invalidates a session when the same account logs in elsewhere, so two clients for one
account log each other out. Build one connection per account and share it.

## Preferred v4 Style

For new code, prefer yielding focused services directly. That keeps dependencies explicit and matches the current Effect v4 style better than pushing everything through one large facade.

```ts
import { Effect } from "effect";
import { AppClient, MessagesClient } from "@schnau/webuntis-api";

const program = Effect.gen(function* () {
  const app = yield* AppClient;
  const messages = yield* MessagesClient;

  const [home, inbox] = yield* Effect.all([app.getHome, messages.getInbox]);

  return {
    schoolName: home.schoolName,
    inboxCount: inbox.incomingMessages.length,
  };
});

await Effect.runPromise(program.pipe(Effect.provide(WebUntis)));
```

The domain services are especially useful when a program only needs one slice of the API:

```ts
import { Effect } from "effect";
import { TimetableClient } from "@schnau/webuntis-api";

const program = Effect.gen(function* () {
  const timetable = yield* TimetableClient;

  return yield* timetable.getEntries({
    start: "2026-03-23",
    end: "2026-03-27",
    resourceType: "CLASS",
    resource: 1,
  });
});

await Effect.runPromise(program.pipe(Effect.provide(WebUntis)));
```

## Timetables for many resources

WebUntis answers `timetable/entries` for one resource per request. `getEntriesForResources`
sends one request per resource and reports each on its own, so one refused or malformed
response does not cost the others:

```ts
import { Effect, Result } from "effect";
import { TimetableClient } from "@schnau/webuntis-api";

const program = Effect.gen(function* () {
  const timetable = yield* TimetableClient;
  const results = yield* timetable.getEntriesForResources(
    { start: "2026-03-23", end: "2026-03-27", resourceType: "CLASS", resources: [1, 2, 3] },
    { concurrency: 4, raw: true },
  );

  for (const { resource, raw, result } of results) {
    if (Result.isSuccess(result)) {
      // result.success is the decoded timetable; raw is the JSON exactly as WebUntis sent it
    } else {
      // result.failure is a WebUntisError; raw is still set if the body was JSON that failed to decode
    }
  }
});
```

Only invalid input fails the whole effect, with `InvalidRequestError`, before anything is
sent. `concurrency` defaults to 1, like `Effect.forEach`; the connection's `limits` apply on
top. With `raw: true`, each result keeps the parsed JSON body next to the decoded value,
including fields the schema does not model and bodies that failed to decode.

## Errors

Every failure is a typed value in the error channel; nothing throws. A request fails with one of
the `WebUntisError` members:

| Error                 | When                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `InvalidCredentials`  | WebUntis refused the credential. The connection stops logging in until `AuthClient.refresh`/`clear`. |
| `PermissionDenied`    | HTTP 403. The account lacks the right; the session stays valid and is not renewed.                   |
| `RateLimited`         | HTTP 429 persisted after waiting as long as each `Retry-After` asked. Carries the last `retryAfter`. |
| `UpstreamRejected`    | Any other refusal whose body names a WebUntis `errorCode`, such as `VALIDATION_ERROR`.               |
| `TransportError`      | No answer, or a refusal WebUntis did not explain. Carries `status` and `body` when there was one.    |
| `DecodeError`         | The response did not match the modeled schema.                                                       |
| `InvalidRequestError` | The caller's input failed validation; nothing was sent.                                              |
| `AuthError`           | Another step of logging in failed, for example the token endpoint answering 5xx.                     |
| `DiscoveryError`      | A school name matched no school or more than one.                                                    |

A 401 makes the client log in again and retry once. Timeouts, network failures, and 408, 429, 500, 502, 503, and 504
responses are retried twice with exponential backoff, never sooner than `Retry-After`.

## Limits

Each connection can cap how hard it uses WebUntis. Both limits are off unless you set them:

```ts
webUntisLayer({
  school,
  credential,
  limits: {
    concurrency: 4,
    budget: { requests: 600, window: "1 minute" },
  },
});
```

`concurrency` bounds requests in flight, counting logins and a request waiting to retry.
`budget` refills evenly (here one request every 100 ms, with bursts up to 600); requests
beyond it wait instead of failing, and every retry attempt counts. After a 429 with
`Retry-After`, the budget also holds back the connection's other requests until the server's
delay has passed.

## School-Year Scoping

`withSchoolYear` applies an explicit school-year context to supported timetable, exam, and
class-register reads. The scope is fiber-local, so nested and concurrent historical reads cannot
leak their selected year into one another.

```ts
import { Effect } from "effect";
import { ExamsClient, SchoolyearsClient, withSchoolYear } from "@schnau/webuntis-api";

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
- `webUntisLayer`, `WebUntisConnection`, `Credential`, and the `SchoolTarget` type
- `searchSchools`
- `withSchoolYear`
- `DiscoveryError`, `AuthError`, `InvalidCredentials`, `PermissionDenied`, `RateLimited`, `UpstreamRejected`, `TransportError`, `DecodeError`, `InvalidRequestError`, and `ConfigurationError`

Every response type is also exported from the root as a type. Every failure a request can produce is
covered by the `WebUntisError` union.

Schema _values_ live on the dedicated subpath instead of the root barrel:

```ts
import { HomeSchema, TimetableEntriesSchema } from "@schnau/webuntis-api/schemas";
```

The subpath exports one schema and one matching type per modeled response, including the element
types of collection responses, so a caller can name intermediate values:

```ts
import type { MessageSummary, TimetableEntry } from "@schnau/webuntis-api";

const subjectOf = (message: MessageSummary) => message.subject;
```

The root package does not export internal raw view helpers, schema values, or public mutating experimental profile routes.

Internal runtime services such as `Connection`, `SchoolResolver`, `SessionState`, `MetadataState`, and `WebUntisHttp` are intentionally kept off the root barrel.

If you need service types for your own signatures, prefer the service-native form:

```ts
import type { AppClient, TimetableClient } from "@schnau/webuntis-api";

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

## Releasing

Forgejo is the canonical repository. Its public
[GitHub mirror](https://github.com/HaukeSchnau/webuntis-api) runs the npm release workflow because
npm Trusted Publishing supports GitHub-hosted runners.

A release is an exact `v<package-version>` tag. Push the version commit to Forgejo, then tag that
commit. The mirror copies branches and tags to GitHub. The workflow rejects a tag that does not
match `package.json`, installs the frozen dependency graph, runs `pnpm run qa`, and publishes through
npm's short-lived OIDC credential. It does not store an npm token.

The mirror normally syncs within 15 minutes.

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
