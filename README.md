# webuntis-api

Headless WebUntis client built on the Effect v4 beta ecosystem.

The client models the modern WebUntis REST surface as a portable Effect service graph:

- `SchoolDiscovery` resolves a school name through the public WebUntis search API.
- `AuthClient` performs the classic login handshake and mints the session-bound JWT from `/WebUntis/api/token/new`.
- `WebUntisHttp` attaches cookies and bearer auth for modern `/api/rest/view/...` requests.
- `WebUntisClient` exposes the first domain clients for `app`, `classreg`, `schoolyears`, `messages`, `profile`, `session`, `timetable`, plus a `rawViewApi` escape hatch.
  The client now also exposes a typed `exams` domain for list, filter, statistics, and detail reads.
  The `app` and `timetable` domains now also cover adjacent bootstrap routes such as `home`, `mobile/data`, `trigger/startup`, `today/meta`, `dashboard/cards`, `app/platform-application/menus`, `app/third-party/data`, `onboarding`, `timegrid`, `timetable/calendar`, `timetable/externalCalendar`, and `timetable/entriesWeekOverview`.
  The timetable domain also exposes typed `availableRooms` support through the confirmed-working `v2` query-parameter route.
  The `messages` domain now covers inbox, drafts, sent, recipient quickfilters, recipient filter/search helpers, reply-form lookup, and individual message detail in addition to status and permissions.
  The timetable client also exposes experimental read probes for the currently restricted settings/format routes so tenant behavior changes are visible in the live suite.
  JSON decoders run with strict excess-property rejection so unexpected upstream fields fail fast instead of being silently dropped.

## Runtime

This package is headless. It does not depend on a browser at runtime.

The current implementation targets the modern REST-first WebUntis flow:

1. School discovery via `https://schoolsearch.webuntis.com/schoolquery2`
2. Session bootstrap via `GET /WebUntis/index.do`
3. Credential submission via `POST /WebUntis/j_spring_security_check`
4. Token minting via `GET /WebUntis/api/token/new`
5. Bearer-authenticated requests to `/WebUntis/api/rest/view/v1/...` plus selected confirmed newer routes such as `v2/home`, `v2/trigger/startup`, `v3/mobile/data`, and `v2/timetable/availableRooms`

Reverse-engineering artifacts live under [`research/webuntis`](./research/webuntis).

## Core Decisions

- We optimize for broad coverage of read-only WebUntis endpoints first. Mutating business endpoints are out of scope for the public client surface.
- We keep a large live test suite against the tenant and treat snapshot churn as a feature, not a problem. Snapshot updates are expected when upstream changes, because the main goal is to surface response drift quickly.
- We keep schemas as strict as the evidence allows: excess properties are rejected, literal unions are preferred over open strings when route behavior or shipped frontend code makes them trustworthy, and uncertain payload sections stay opaque until we have enough live or source evidence to model them safely.
- We aim for idiomatic Effect v4 code throughout. When an Effect v4 or unstable-platform API choice is unclear, we resolve it against the local [`$context-repo`](/Users/haukeschnau/.agents/skills/context-repo/SKILL.md) docs and source.
- Live API exploration is done with [`$agent-browser`](/Users/haukeschnau/.agents/skills/agent-browser/SKILL.md), preferably through subagents, so runtime findings come from the real frontend and not from hand-wavy guesses.

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
- Snapshot tests normalize volatile live payload fields, and we expect to refresh those snapshots whenever the upstream API legitimately changes.
- The live suite also pins the current behavior of adjacent routes such as `classreg/absences/meta`, `classreg/homework/meta`, `session/status`, `today/meta`, `dashboard/cards`, `timetable/menu`, `timetable/search`, `timetable/entriesWeekOverview`, the currently failing `profile` summary/admin endpoints, and currently blocked read-only routes such as `messages-of-the-day`, `rooms`, `teachers`, and `subjects`.
- Reverse-engineering snapshot tests pin the mined frontend endpoint inventory so upstream bundle drift is obvious.
- Strict decoding is intentionally evidence-driven. When a route only returns empty arrays on the live tenant, we keep the container exact and leave the item payload opaque until live responses or shipped frontend code justify a narrower schema.
