# Runtime Route Map

Observed against `https://igs-lilienthal.webuntis.com/` on March 26, 2026.

Scope:

- tenant: `igs-lilienthal.webuntis.com`
- school: `IGS Lilienthal`
- account: `hauke.studienbuch`
- visible role in the SPA: `STAFF` / `Verwaltung`

This artifact captures route-to-API observations from a real authenticated browser session.
It is narrower than `modern-rest-endpoints.json`: only routes and requests that were actually exercised in the tested UI flow are listed here.

## Route Observations

### `/today`

- Visible entrypoint: top-level `Heute`
- Visible sub-navigation: none beyond the global left navigation in this session
- Observed XHR routes:
  - `GET /WebUntis/api/rest/view/v1/app/data`
  - `GET /WebUntis/api/rest/view/v1/app/platform-application/menus`
  - `GET /WebUntis/api/rest/view/v1/app/third-party/data`
  - `GET /WebUntis/api/rest/view/v1/dashboard/cards/status`
  - `GET /WebUntis/api/rest/view/v1/messages/permissions`
  - `GET /WebUntis/api/rest/view/v1/messages/status`
  - `GET /WebUntis/api/rest/view/v1/schoolyears`
  - `GET /WebUntis/api/rest/view/v2/trigger/startup`
  - `GET /WebUntis/api/token/new`
- Section-specific traffic: yes
- Notes:
  - This route behaves like a shared bootstrap surface for the SPA.
  - The current live frontend uses `v2/trigger/startup` here, even though the repo also documents the older `v1` startup route.

### `/messages/inbox`

- Visible entrypoint: top-level `Mitteilungen`
- Visible sub-navigation:
  - `Posteingang`
  - `Gesendet`
  - `Entwürfe`
  - `Listen`
- Observed XHR routes:
  - `GET /WebUntis/api/rest/view/v1/messages`
  - `GET /WebUntis/api/rest/view/v1/messages/status`
  - `GET /WebUntis/api/token/new`
- Section-specific traffic: yes
- Notes:
  - Inbox loading stayed on the `v1` route family in this session.
  - A rendered inbox message list was present for this account.

### `/messages/sent`

- Visible entrypoint: `Mitteilungen` -> `Gesendet`
- Visible sub-navigation:
  - `Posteingang`
  - `Gesendet`
  - `Entwürfe`
  - `Listen`
- Observed XHR routes:
  - `GET /WebUntis/api/rest/view/v1/messages/sent`
  - `GET /WebUntis/api/token/new`
- Section-specific traffic: yes
- Notes:
  - The screen rendered an empty state, but the section-specific `v1/messages/sent` request still fired.

### `/messages/drafts`

- Visible entrypoint: `Mitteilungen` -> `Entwürfe`
- Visible sub-navigation:
  - `Posteingang`
  - `Gesendet`
  - `Entwürfe`
  - `Listen`
- Observed XHR routes:
  - `GET /WebUntis/api/rest/view/v1/messages/drafts`
  - `GET /WebUntis/api/token/new`
- Section-specific traffic: yes
- Notes:
  - The list route itself stayed on `v1`.
  - The compose-related drift in this area shows up only after deeper interaction inside the draft/new-message flow.

### `/timetable/class?date=2026-03-23`

- Visible entrypoint: top-level `Stundenplan`
- Visible sub-navigation:
  - `Klasse`
  - `Schüler*in`
  - `Lehrkraft`
  - `Raum`
  - `Fach`
  - `Tag - Klassen`
  - `Tag - Lehrkräfte`
  - `Tag - Räume`
  - `Woche - Klassen`
  - `Woche - Lehrkräfte`
  - `Woche - Räume`
  - `Sprechstunden`
- Observed XHR routes:
  - `GET /WebUntis/api/rest/view/v1/timetable/grid?timetableType=STANDARD`
  - `GET /WebUntis/api/rest/view/v1/timetable/filter?resourceType=CLASS&timetableType=STANDARD&start=2026-03-23&end=2026-03-27`
  - `GET /WebUntis/api/rest/view/v1/timetable/calendar?myTimetable=false&timetableType=STANDARD`
  - `GET /WebUntis/api/rest/view/v1/timetable/entries/settings?format=2&resourceType=CLASS`
  - `GET /WebUntis/api/rest/view/v1/onboarding?type=TIMETABLE`
  - `GET /WebUntis/api/rest/view/v1/timetable/entries?start=2026-03-23&end=2026-03-27&format=2&resourceType=CLASS&resources=470&periodTypes=&timetableType=STANDARD&layout=START_TIME`
  - `GET /WebUntis/api/token/new`
- Section-specific traffic: yes
- Notes:
  - This matched the earlier timetable research: the visible timetable screen still uses the `v1` grid/filter/calendar/entries family.
  - No `availableRooms` route was emitted on this default class timetable screen.

### `/teacher-lessons`

- Visible entrypoint: top-level `Unterricht`
- Visible sub-navigation:
  - `Lehrkraft`
  - `Klasse`
  - `Schüler*in`
  - `Prüfungen`
  - `Prüfungsstatistik`
  - `Lehrkraft - Tag`
  - `Klasse - Tag`
  - `Stundenliste Lehrkraft`
  - `Stundenliste Klasse`
- Observed XHR routes:
  - `GET /WebUntis/api/token/new`
- Section-specific traffic: not observed
- Notes:
  - This route appeared lazy-loaded or interaction-gated in this pass.
  - The screen chrome and sub-navigation rendered, but no dedicated `teacher-lessons` data route fired before further interaction.
  - Treat the absence of section-specific traffic here as an observation, not proof that no such endpoint exists.

## Message Compose Flow

Starting point:

- route: `/messages/drafts`
- visible action: `Neu`

Observed behavior:

- Opening the compose drawer itself did not trigger a dedicated message-compose bootstrap request in this session.
- Choosing `Kolleg*innen` in the recipient picker opened an additional selection dialog and triggered:
  - `POST /WebUntis/api/rest/view/v2/messages/recipients/STAFF/filter`
- Typing into `Kolleg*innen suchen` reused that same `v2 ... /filter` route instead of switching to a separate `search` route.

Observed request body while typing `sei`:

```json
{"filters":[],"searchText":"sei"}
```

Drift note:

- The shipped client and current request descriptors in this repository still model message recipient filter/search on the `v1` route family.
- The live compose flow for this tenant and role is already using the `v2` filter endpoint for both the initial recipient list and search text refinement.

## Current Interpretation

- The route map shows a mixed-version frontend rather than a clean all-`v2` migration.
- Top-level list and timetable screens still lean heavily on `v1`.
- Newer compose-recipient behavior has already moved at least one live interaction to `v2`.
- The most likely next implementation target is a focused follow-up on message recipient route compatibility, ideally with cross-tenant caution before changing the public client behavior.
