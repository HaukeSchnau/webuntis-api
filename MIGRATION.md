# Migration Guide

This release intentionally reshapes the package toward explicit Effect v4 services and a smaller public API.

## High-Level Changes

- Services now follow the `ServiceMap.Service` style directly.
- The package exports first-class domain services instead of pushing everything through inferred client factory types.
- Request construction now goes through reusable typed descriptors.
- Internal or unstable helpers are no longer exported from the package root.
- Public mutating experimental profile routes were removed.
- Config loading and school discovery are stricter and fail earlier.

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
- public mutating experimental profile routes are removed
- the root package is intentionally read-only and stable-focused

If you still need reverse-engineering probes, keep them in repository-internal code or tests instead of depending on them from published consumers.

## Layer Construction

The recommended wiring pattern is:

```ts
import { Effect, Layer } from "effect";
import { clientConfigFromEnv, makeWebUntisLayer } from "webuntis-api";

const layer = Layer.unwrap(
  clientConfigFromEnv().pipe(Effect.map(makeWebUntisLayer)),
);
```

That layer provides the aggregate client plus the focused domain services.

## Runtime Behavior Changes

These changes are intentional and may surface failures that older versions silently tolerated:

- ambiguous school discovery now fails with a typed discovery error
- invalid `WEBUNTIS_SERVER_URL` now fails during config loading
- token refresh invalidates stale metadata and reloads `app/data` before metadata-dependent requests proceed

If a previously working setup now fails during bootstrap, check whether the tenant needs to be pinned more explicitly through `WEBUNTIS_SCHOOL_LOGIN_NAME`, `WEBUNTIS_SERVER`, `WEBUNTIS_SERVER_URL`, or `WEBUNTIS_TENANT_ID`.

## Request Modeling Changes

Request behavior is now modeled explicitly:

- request descriptors define method, path, query, schema, and auth policy
- metadata-bearing routes opt into metadata headers through `RequestPolicy.Metadata`
- auth-only routes opt into `RequestPolicy.AuthOnly`

This mostly matters if you were working in repository internals or extending the client with new endpoints. New endpoints should follow the `requests.ts` plus `index.ts` domain pattern.

## Repo Layout

The implementation moved from the older flat structure to:

- `src/internal/*` for bootstrap, config, discovery, transport, request descriptors, and errors
- `src/domains/<domain>/index.ts` for public service definitions
- `src/domains/<domain>/requests.ts` for route descriptors

If you maintained local patches on top of the old layout, expect path changes.

## Suggested Upgrade Steps

1. Replace inferred client-factory types with `ServiceClass["Service"]` where needed.
2. Update programs to `yield*` the specific domain services they use.
3. Remove any dependency on root-exported raw or experimental write routes.
4. Re-check env configuration, especially tenant pinning and `WEBUNTIS_SERVER_URL`.
5. Run `bun run typecheck`, `bun run test:unit`, and your live suite.
