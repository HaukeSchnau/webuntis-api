# Migration Guide

## 0.4.0

### Effect 4

The package runs on stable Effect 4. The `effect` peer range is `^4.0.0`, so any Effect 4.x
release satisfies it. Effect 4.0.0 moved the HTTP modules from `effect/unstable/http` to
`effect/http`; if your own code imports them, update those imports together with this package.

### Connections from values

The client no longer reads its configuration on its own. You build a layer from a connection
value, and the layer takes its `HttpClient` from context:

```ts
// Before
program.pipe(Effect.provide(webUntisLayer)); // read WEBUNTIS_* from the environment
program.pipe(Effect.provide(makeWebUntisLayer(config)));

// After
const WebUntis = webUntisLayer({
  school: { loginName: "igs-lilienthal", serverUrl: "igs-lilienthal.webuntis.com" },
  credential: Credential.Password({ username, password: Redacted.make(password) }),
}).pipe(Layer.provide(FetchHttpClient.layer));
program.pipe(Effect.provide(WebUntis));
```

To keep reading the environment, unwrap `WebUntisConnection.fromEnv`, a `Config` that reads
through the current `ConfigProvider`:

```ts
const WebUntis = Layer.unwrap(Effect.map(WebUntisConnection.fromEnv, webUntisLayer)).pipe(
  Layer.provide(FetchHttpClient.layer),
);
```

| Removed                                     | Replacement                                                  |
| ------------------------------------------- | ------------------------------------------------------------ |
| `webUntisLayer` (a value)                   | `webUntisLayer(connection)`                                  |
| `makeWebUntisLayer(config, transportLayer)` | `webUntisLayer(connection)` plus `Layer.provide(httpClient)` |
| `ClientConfig`, `clientConfigFromEnv`       | `WebUntisConnection.fromEnv`                                 |
| `WebUntisClientConfig`, `LiveEnvInput`      | `WebUntisConnection`                                         |
| `WEBUNTIS_SERVER`                           | `WEBUNTIS_SERVER_URL`, which also accepts a bare host        |
| `WEBUNTIS_DISCOVERY_ENDPOINT`               | none; `searchSchools` always queries WebUntis' school search |

`school` takes a `SchoolTarget` or a name to look up. `WebUntisConnection.fromEnv` pins the
school only when both `WEBUNTIS_SCHOOL_LOGIN_NAME` and `WEBUNTIS_SERVER_URL` are set; a lone
`WEBUNTIS_TENANT_ID` no longer pins anything.

`searchSchools(query)` is new and returns WebUntis' description of each matching school. Any
result can be passed as a connection's `school`. Its schema is `SchoolSchema` on the
`/schemas` subpath.

Each `webUntisLayer` call builds an independent client, so several schools or accounts can run
in one process. The README shows how to key them with `LayerMap`.

### Typed refusals

`WebUntisError` gained four members, so exhaustive matches need new cases:

- `InvalidCredentials` replaces `AuthError { stage: "token", status: 302 }` for a wrong
  password. The connection remembers the refusal and stops logging in until
  `AuthClient.refresh` or `AuthClient.clear`.
- `PermissionDenied` replaces `TransportError { status: 403 }`. A 403 no longer drops the
  session and logs in again; only a 401 does.
- `RateLimited` replaces `TransportError { status: 429 }` once retries that honored
  `Retry-After` are used up.
- `UpstreamRejected` replaces `TransportError` for any other non-2xx response whose JSON body
  carries an `errorCode`. `errorCode`, `status`, and the full `body` are fields.

`TransportError` remains for network failures and unexplained responses. `AuthError` lost
its unused `"discovery"` stage. A 403 from the metadata bootstrap (`app/data`) is now
`PermissionDenied` instead of `AuthError { stage: "metadata" }`.

### Limits

`WebUntisConnection.limits` takes an optional `concurrency` and `budget`
(`{ requests, window }`). Both default to unlimited, as before.

## 0.3.0

`TimetableClient.getEntries` takes one `resource` ID instead of a `resources` array. Since
2026-09-04 WebUntis rejects entries requests with several resources (`400 VALIDATION_ERROR`,
"Exactly one resource required"), so callers must issue one request per resource:

```ts
// Before
timetable.getEntries({ start, end, resourceType: "CLASS", resources: [1, 2] });

// After
Effect.forEach([1, 2], (resource) =>
  timetable.getEntries({ start, end, resourceType: "CLASS", resource }),
);
```

`getEntriesWeekOverview` still accepts a `resources` array.

`TransportError.message` now ends with a single-line excerpt of the response body, so logged
causes show WebUntis' reason for a rejected request. The full body stays in `TransportError.body`.

The `effect` peer dependency is pinned to `4.0.0-rc.108`. Later release candidates and Effect
4.0.0 moved `effect/unstable/http` to `effect/http` and changed `Config`, so the old
`^4.0.0-rc.108` range admitted versions this package cannot load. Moving to Effect 4.0.0 needs its
own release.

## 0.2.0

This release reshapes the package toward explicit Effect v4 services and a smaller public API.

Timetable class filters now model `department` as nullable, matching live tenants where some
classes have no department. Student filter items also have a typed public schema with their class
memberships and source date ranges.

## High-Level Changes

- Services now follow Effect v4's `Context.Service` style directly.
- The package exports first-class domain services instead of pushing everything through inferred client factory types.
- Request construction now goes through reusable typed descriptors.
- Internal or unstable helpers are no longer exported from the package root.
- Public mutating experimental profile routes were removed.
- Config loading and school discovery are stricter and fail earlier.
- Zero-argument reads are readonly `Effect` values instead of methods.
- Caller inputs are validated before any transport request is sent.

## Most Common Update

If you previously accessed everything through the aggregate client, that still works:

```ts
const program = Effect.gen(function* () {
  const client = yield* WebUntisClient;
  return yield* client.messages.getInbox;
});
```

But for new code, prefer depending on the focused domain service directly:

```ts
const program = Effect.gen(function* () {
  const messages = yield* MessagesClient;
  return yield* messages.getInbox;
});
```

This is the main intended usage change.

## Before / After

### Aggregate facade

Before:

```ts
const program = Effect.gen(function* () {
  const client = yield* WebUntisClient;
  const data = yield* client.app.getData;
  return data;
});
```

After:

```ts
const program = Effect.gen(function* () {
  const app = yield* AppClient;
  return yield* app.getData;
});
```

The aggregate `WebUntisClient` is still available, but it is now clearly the convenience layer rather than the only intended surface.

### Service typing

Before, code often relied on inferred factory output types.

After, prefer the service-native type shape:

```ts
import type { MessagesClient } from "@schnau/webuntis-api";

type MessagesService = MessagesClient["Service"];
```

### Raw / unstable APIs

Before, raw view helpers and unstable routes leaked into the root export surface.

After:

- raw view helpers are internal-only
- schemas moved to the `@schnau/webuntis-api/schemas` subpath
- public mutating experimental profile routes are removed
- the root package is intentionally read-only and stable-focused

If you still need reverse-engineering probes, keep them in repository-internal code or tests instead of depending on them from published consumers.

## Layer Construction

The recommended wiring pattern is:

```ts
import { Effect } from "effect";
import { webUntisLayer } from "@schnau/webuntis-api";

await Effect.runPromise(program.pipe(Effect.provide(webUntisLayer)));
```

That layer provides the aggregate client plus the focused domain services, and resolves its
configuration through the ambient `ConfigProvider` when it is built.

If you hold a configuration value already, `makeWebUntisLayer(config)` takes it directly. The
`Layer.unwrap(clientConfigFromEnv().pipe(Effect.map(makeWebUntisLayer)))` dance earlier versions
recommended still works, but `webUntisLayer` replaces it.

The former public `layer` alias was removed.

## Runtime Behavior Changes

These changes are intentional and may surface failures that older versions silently tolerated:

- ambiguous school discovery now fails with a typed discovery error
- invalid `WEBUNTIS_SERVER_URL` now fails during config loading
- stale 401 responses cannot invalidate a newer authenticated session
- a retry keeps the same tenant-aware request policy as its initial attempt
- additive response fields are tolerated at runtime, while missing or malformed known fields still fail with `DecodeError`

If a previously working setup now fails during bootstrap, check whether the tenant needs to be pinned more explicitly through `WEBUNTIS_SCHOOL_LOGIN_NAME`, `WEBUNTIS_SERVER`, `WEBUNTIS_SERVER_URL`, or `WEBUNTIS_TENANT_ID`.

## Request Modeling Changes

Request behavior is now modeled explicitly:

- request descriptors define method, path, query, schema, and auth policy
- metadata-bearing routes opt into metadata headers through `RequestPolicy.Metadata`
- auth-only routes opt into `RequestPolicy.AuthOnly`
- request descriptors validate dates, ranges, positive IDs, non-empty resources, and endpoint discriminants before transport

Invalid caller input now fails as `InvalidRequestError`, which is included in `WebUntisError`.

## Zero-Argument Reads

Operations that need no caller input are now readonly Effect values:

```ts
const home = yield * app.getHome;
const inbox = yield * messages.getInbox;
const years = yield * schoolyears.list;
```

Remove trailing `()` from those operations. Methods that accept request input remain functions.

This mostly matters if you were working in repository internals or extending the client with new endpoints. New endpoints should follow the `requests.ts` plus `index.ts` domain pattern.

Several non-trivial lookup methods also moved from positional arguments to request objects:

```ts
yield * messages.getRecipientFilter({ recipientOption: "STAFF" });
yield *
  messages.searchRecipients({
    recipientOption: "STAFF",
    searchText: "anna",
  });
yield * messages.getMessage({ id: 123 });
yield * exams.getExam({ id: 42 });
yield * timetable.getGrid({ timetableType: "STANDARD" });
```

## Repo Layout

The implementation moved from the older flat structure to:

- `src/internal/*` for bootstrap, config, discovery, transport, request descriptors, and errors
- `src/domains/<domain>/index.ts` for public service definitions
- `src/domains/<domain>/requests.ts` for route descriptors

If you maintained local patches on top of the old layout, expect path changes.

## Suggested Upgrade Steps

1. Replace inferred client-factory types with `ServiceClass["Service"]` where needed.
2. Update programs to `yield*` the specific domain services they use.
3. Switch schema imports to `@schnau/webuntis-api/schemas`.
4. Update positional lookup calls to the new request-object form.
5. Remove any dependency on root-exported raw or experimental write routes.
6. Re-check env configuration, especially tenant pinning and `WEBUNTIS_SERVER_URL`.
7. Remove trailing `()` from zero-argument reads and authentication operations.
8. Handle `InvalidRequestError` where you narrow request failures.
9. Run `just lint`, `just test-unit`, and your live suite.

## Audit Follow-Up Changes

A full repository audit produced one further round of intentional changes.

### Removed or renamed exports

| Before                                                                                                                 | After                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `RequestFailure`                                                                                                       | `WebUntisError` — the two were the same union under two names                                           |
| `client.withSchoolYear(id)`                                                                                            | `withSchoolYear(id)` from the package root                                                              |
| `AuthenticationError`, `SchemaDriftError`, `SchoolSearchError`, `MissingConfigurationError`, `UnexpectedResponseError` | the primary names: `AuthError`, `DecodeError`, `DiscoveryError`, `ConfigurationError`, `TransportError` |

`withSchoolYear` never depended on the aggregate client, so the field was pure duplication of the
root export. Replace `client.withSchoolYear(id)` with the imported operator; behavior is identical.

### Added exports

- `webUntisLayer`, the environment-driven composition root.
- `ClientConfig.load`, which resolves configuration through the ambient `ConfigProvider`.
- A type for every modeled response, including collection element types such as `MessageSummary`,
  `TimetableEntry`, `Exam`, and `DisplayResource`.
- `OnboardingType`, previously reachable only from the `/schemas` subpath.

### Behavior changes

- Entity identifiers decode with `Schema.Int` instead of `Schema.Finite`. A fractional id now fails
  with `DecodeError` rather than entering the domain model. Whole JSON numbers are unaffected.
- `timetableType` and `layout` on timetable entry requests reject blank strings, matching the
  validation the other timetable routes already applied.
- `ClientConfig.Live` no longer snapshots `process.env` at import time. It reads configuration when
  the layer is built, so `ConfigProvider` overrides take effect.
- Request types are now derived from their input schemas. `ExamDateRangeRequest`'s absent branch is
  `{ start?: undefined; end?: undefined }` rather than `{ start?: never; end?: never }`; the two
  disagreed under `exactOptionalPropertyTypes`.

### Supported runtimes

`engines.node` moved from `>=20.19.0` to `>=22.12.0`, and the build targets `node22`. Node 20 reached
end of life on 2026-04-30, so the previous floor could not be built or verified.
