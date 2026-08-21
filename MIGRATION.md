# Migration Guide

This release intentionally reshapes the package toward explicit Effect v4 services and a smaller public API.

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
import type { MessagesClient } from "webuntis-api";

type MessagesService = MessagesClient["Service"];
```

### Raw / unstable APIs

Before, raw view helpers and unstable routes leaked into the root export surface.

After:

- raw view helpers are internal-only
- schemas moved to the `webuntis-api/schemas` subpath
- public mutating experimental profile routes are removed
- the root package is intentionally read-only and stable-focused

If you still need reverse-engineering probes, keep them in repository-internal code or tests instead of depending on them from published consumers.

## Layer Construction

The recommended wiring pattern is:

```ts
import { Effect } from "effect";
import { webUntisLayer } from "webuntis-api";

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
3. Switch schema imports to `webuntis-api/schemas`.
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
