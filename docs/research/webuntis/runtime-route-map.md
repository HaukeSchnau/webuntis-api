# Runtime Route Map

Observed against `https://igs-lilienthal.webuntis.com/` on March 26 and April 17, 2026.

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

### `/messages/lists`

- Visible entrypoint: `Mitteilungen` -> `Listen`
- Visible sub-navigation:
  - `Posteingang`
  - `Gesendet`
  - `Entwürfe`
  - `Listen`
- Observed XHR routes:
  - `GET /WebUntis/api/rest/view/v1/messages/recipients/quickfilters`
- Section-specific traffic: yes
- Notes:
  - In this tenant and role, the list-management surface reused the existing quickfilter endpoint.
  - This looked like a UI shell over already-supported recipient quickfilter data rather than a distinct missing route family.

### `/exams`

- Visible entrypoint: `Unterricht` -> `Prüfungen`
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
  - `GET /WebUntis/api/rest/view/v1/exams/filter`
  - `GET /WebUntis/api/rest/view/v1/exams/filter?start=2026-04-13&end=2026-04-19`
  - `GET /WebUntis/api/rest/view/v1/exams?start=2026-04-13&end=2026-04-19&withDeleted=false`
  - `GET /WebUntis/api/rest/view/v1/app/platform-application/exam-integrations`
- Section-specific traffic: yes
- Notes:
  - The current public client already covers `exams` and `exams/filter`.
  - The additional `app/platform-application/exam-integrations` request was emitted by the live UI and is not currently modeled in `src/domains/app`.

### `/exam-statistics`

- Visible entrypoint: `Unterricht` -> `Prüfungsstatistik`
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
  - `GET /WebUntis/api/rest/view/v1/exams/filter`
  - `GET /WebUntis/api/rest/view/v1/exams/filter?start=2026-04-13&end=2026-04-19`
  - `GET /WebUntis/api/rest/view/v1/exams/statistics?start=2026-04-13&end=2026-04-19`
- Section-specific traffic: yes
- Notes:
  - This aligned with the current `ExamsClient.getStatistics()` implementation.
  - The browser confirmed the UI adds an explicit date range when loading the statistics table.

### `/absences`

- Visible entrypoint: top-level `Klassenbuch`
- Visible sub-navigation:
  - `Abwesenheiten`
  - `Fehlzeiten`
  - `Hausaufgaben`
  - `Klassendienste`
  - `Befreiungen`
  - `Berichte`
- Observed XHR routes:
  - no dedicated class-register read route observed before further interaction
- Section-specific traffic: not observed
- Notes:
  - The top-level class-register shell rendered, but it did not eagerly fetch a dedicated `classreg` read model on first load in this session.
  - Treat this as a lazy-loading observation rather than proof that the route is data-free.

### `/homework`

- Visible entrypoint: `Klassenbuch` -> `Hausaufgaben`
- Visible sub-navigation:
  - `Abwesenheiten`
  - `Fehlzeiten`
  - `Hausaufgaben`
  - `Klassendienste`
  - `Befreiungen`
  - `Berichte`
- Observed XHR routes:
  - `GET /WebUntis/api/rest/view/v1/classreg/homework/meta`
  - `POST /WebUntis/api/rest/view/v1/classreg/homework/list`
- Section-specific traffic: yes
- Notes:
  - This matched the existing `ClassregClient` coverage.
  - The browser confirmed that the list screen still uses the `v1` POST-backed homework list route in the live UI.

### `/class-register-reports`

- Visible entrypoint: `Klassenbuch` -> `Berichte`
- Visible sub-navigation:
  - `Abwesenheiten`
  - `Fehlzeiten`
  - `Hausaufgaben`
  - `Klassendienste`
  - `Befreiungen`
  - `Berichte`
- Observed XHR routes:
  - no dedicated report route observed before further interaction
- Section-specific traffic: not observed
- Notes:
  - This route currently looked like another lazy shell.
  - Further exploration would need a report-specific selector or filter interaction to reveal the backing read endpoints, if any.

### `/profile`

- Visible entrypoint: top-level `Kontaktdaten`
- Visible sub-navigation: none beyond the global left navigation in this session
- Observed XHR routes:
  - no dedicated profile read route observed before further interaction
- Section-specific traffic: not observed
- Notes:
  - The route itself did not eagerly call `v1/profile/user-contact-data` or `v1/profile/user-email` during this browser pass.
  - That does not invalidate the existing client coverage, but it means the SPA route-to-endpoint mapping for contact data is still incomplete.

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

## Read-Only Blind Spots

- Missing route coverage:
  - `GET /WebUntis/api/rest/view/v1/app/platform-application/exam-integrations` is emitted by the live `Prüfungen` surface and is not currently exposed by the client.
- Route mapping still incomplete:
  - `Kontaktdaten` currently resolves to `/profile`, but this browser pass did not reveal which interaction actually triggers the proven `profile/user-contact-data` and `profile/user-email` endpoints.
  - `Klassenbuch` resolves to `/absences`, but the shell does not eagerly reveal which endpoints back `Abwesenheiten`, `Fehlzeiten`, `Klassendienste`, or `Befreiungen`.
  - `Unterricht` subviews such as `Lehrkraft`, `Klasse`, `Schüler*in`, `Lehrkraft - Tag`, `Klasse - Tag`, and `Stundenliste Klasse` still need route-by-route probing with deeper interaction.
- Schema follow-up opportunities:
  - If `exam-integrations` is added, it should ship with a strict schema instead of another raw JSON passthrough.
  - The browser evidence around `exams/statistics` suggests a follow-up raw payload capture would be worthwhile to tighten remaining generic shapes such as `countPerGrade`.
