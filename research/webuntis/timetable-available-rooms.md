# Timetable `availableRooms`

Date: 2026-03-13
Tenant used for probing: `igs-lilienthal.webuntis.com`

## Confirmed working route

- `GET /WebUntis/api/rest/view/v2/timetable/availableRooms`
- Auth: bearer token from `/WebUntis/api/token/new` plus the authenticated cookie jar
- Query params:
  - `startDateTime`
  - `endDateTime`
- Response shape: JSON array of room-like resources
  - `{ id, name, longName, displayName }`

Example probe:

```bash
curl 'https://igs-lilienthal.webuntis.com/WebUntis/api/rest/view/v2/timetable/availableRooms?startDateTime=2026-03-13T08:00:00&endDateTime=2026-03-13T10:00:00' \
  -H "authorization: Bearer <token>" \
  -H 'Tenant-Id: 6603700'
```

## v1 findings

The frontend bundle still ships a generated client stub for:

- `GET /api/rest/view/v1/timetable/availableRooms`
- `Content-Type: application/json`
- required parameter name: `dateTimeRange`

The generated code serializes `dateTimeRange` into `ue.data`, but live replay with `curl` did not yield a successful v1 call on this tenant.

Observed v1 validation response:

```json
{
  "errorCode": "VALIDATION_ERROR",
  "validationErrors": [
    { "path": "dateTimeRange.start", "errorMessage": "darf nicht null sein" },
    { "path": "dateTimeRange.end", "errorMessage": "darf nicht null sein" }
  ]
}
```

That means the server-side contract still references `dateTimeRange.start` / `dateTimeRange.end`, but the practical headless route we can confirm end-to-end today is v2.

## Focused source/runtime pass

Date: 2026-03-14

### Source-side findings

- The shipped bundle still contains both generated route stubs:
  - `/api/rest/view/v1/timetable/availableRooms`
  - `/api/rest/view/v2/timetable/availableRooms`
- Each literal route string appears once in the bundle, inside the generated `TimetableRoomsApi` block.
- I did not find a separate human-readable callsite or UI label that clearly references either route.

### Runtime findings

I used a real authenticated browser session and inspected the resource timeline for the visible room-related screens. In the tested frontend flows, neither `availableRooms` route was called.

Observed room-related route loads:

- `/timetable/room`
  - `v1/timetable/grid?timetableType=STANDARD`
  - `v1/timetable/filter?resourceType=ROOM&...`
  - `v1/timetable/calendar?myTimetable=false&timetableType=STANDARD`
  - `v1/timetable/entries/settings?format=2&resourceType=ROOM`
  - `v1/timetable/entries?...resourceType=ROOM...`
  - `v1/onboarding?type=TIMETABLE`
- `/timetable-day-overview/room?date=2026-03-23`
  - `v1/timetable/grid?timetableType=OVERVIEW_DAY`
  - `v1/timetable/filter?resourceType=ROOM&timetableType=OVERVIEW_DAY&...`
  - `v1/timetable/calendar?myTimetable=false&timetableType=OVERVIEW_DAY`
  - `v1/timetable/entries/settings?format=2&resourceType=ROOM`
  - `v1/timetable/entries?...resourceType=ROOM&timetableType=OVERVIEW_DAY...`
- `/timetable-week-overview/room?date=2026-03-23`
  - `v1/timetable/grid?timetableType=OVERVIEW_WEEK`
  - `v1/timetable/filter?resourceType=ROOM&timetableType=OVERVIEW_WEEK&...`
  - `v1/timetable/entriesWeekOverview?...resourceType=ROOM...`

Additional top-level checks on `/today`, `/teacher-lessons`, and `/absences` also did not emit either `availableRooms` route.

### Conclusion

I found no runtime evidence that the currently surfaced frontend calls either `v1/timetable/availableRooms` or `v2/timetable/availableRooms`.

The most likely interpretation is:

- the bundle still ships both generated API stubs
- the visible frontend currently relies on other timetable endpoints instead
- `availableRooms` is either dormant/unused in the present UI or only reachable through a deeper edit dialog that was not surfaced by the visible navigation tested here

So, based on the evidence from this pass, `v2` has not obviously replaced `v1` in the live frontend. Instead, neither route appears to be in active use on the tested screens.

## Transport note

`@effect/platform-bun`'s fetch-backed `HttpClient` was returning `ECONNRESET` for the classic login POST to `j_spring_security_check` during this pass, while plain headless `fetch` and `curl` succeeded with a normal `302` redirect. Auth bootstrap now uses plain `fetch` for that handshake.
