# webuntis-api

Headless WebUntis client built on the Effect v4 beta ecosystem.

The client models the modern WebUntis REST surface as a portable Effect service graph:

- `SchoolDiscovery` resolves a school name through the public WebUntis search API.
- `AuthClient` performs the classic login handshake and mints the session-bound JWT from `/WebUntis/api/token/new`.
- `WebUntisHttp` attaches cookies and bearer auth for modern `/api/rest/view/v1/...` requests.
- `WebUntisClient` exposes the first domain clients for `app`, `schoolyears`, `messages`, `profile`, `session`, `timetable`, plus a `rawViewApi` escape hatch.
  The `app` and `timetable` domains now also cover adjacent bootstrap routes such as `home`, `mobile/data`, `trigger/startup`, and `timetable/calendar`.
  The timetable domain also exposes typed `availableRooms` support through the confirmed-working `v2` query-parameter route.
  The `messages` domain now covers inbox, drafts, sent, recipient quickfilters, recipient filter/search helpers, reply-form lookup, and individual message detail in addition to status and permissions.
  The timetable client also exposes experimental read probes for the currently restricted settings/format routes so tenant behavior changes are visible in the live suite.

## Runtime

This package is headless. It does not depend on a browser at runtime.

The current implementation targets the modern REST-first WebUntis flow:

1. School discovery via `https://schoolsearch.webuntis.com/schoolquery2`
2. Session bootstrap via `GET /WebUntis/index.do`
3. Credential submission via `POST /WebUntis/j_spring_security_check`
4. Token minting via `GET /WebUntis/api/token/new`
5. Bearer-authenticated requests to `/WebUntis/api/rest/view/v1/...` and selected confirmed `v2` routes such as `timetable/availableRooms`

Reverse-engineering artifacts live under [`research/webuntis`](./research/webuntis).

## Development

Install dependencies:

```bash
bun install
```

Run the static checks:

```bash
bun run typecheck
```

Run tests:

```bash
bun run test
```

The live integration suite activates automatically when these environment variables are set:

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

Without credentials, the live suite is skipped and the tests explain which variables are missing.

## Example

```ts
import { Effect, Layer } from "effect";
import { WebUntisClient, clientConfigFromEnv, makeWebUntisLayer } from "webuntis-api";

const program = Effect.gen(function*() {
  const client = yield* WebUntisClient;
  const appData = yield* client.app.getData;
  const schoolyears = yield* client.schoolyears.list;

  return {
    school: appData.tenant.displayName,
    schoolyears
  };
});

const layer = Layer.unwrap(
  clientConfigFromEnv().pipe(Effect.map(makeWebUntisLayer))
);

await Effect.runPromise(program.pipe(Effect.provide(layer)));
```

## Testing Strategy

- Live tests use `@effect/vitest` against a real tenant.
- Snapshot tests normalize volatile live payload fields.
- The live suite also pins the current behavior of adjacent routes such as `session/status`, `timetable/menu`, `timetable/search`, and the currently failing `profile` summary/admin endpoints.
- Reverse-engineering snapshot tests pin the mined frontend endpoint inventory so upstream bundle drift is obvious.
