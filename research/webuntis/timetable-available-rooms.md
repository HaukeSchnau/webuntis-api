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

## Transport note

`@effect/platform-bun`'s fetch-backed `HttpClient` was returning `ECONNRESET` for the classic login POST to `j_spring_security_check` during this pass, while plain headless `fetch` and `curl` succeeded with a normal `302` redirect. Auth bootstrap now uses plain `fetch` for that handshake.
