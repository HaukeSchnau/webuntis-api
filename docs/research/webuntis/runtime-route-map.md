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
  - The route loaded an embedded legacy shell via `https://igs-lilienthal.webuntis.com/WebUntis/embedded.do?showSidebar=true`.
  - No modern `api/rest/view/...` request fired on initial route load in this pass.
  - Treat this as evidence that the top-level `Unterricht` shell still delegates to legacy WebUntis before deeper interaction, not proof that no modern subview endpoints exist.

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
  - The additional `app/platform-application/exam-integrations` request is emitted by the live UI and is now modeled in `AppClient.getExamIntegrations()`.

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
  - The route loaded an embedded legacy shell via `https://igs-lilienthal.webuntis.com/WebUntis/embedded.do?showSidebar=true`.
  - No modern `api/rest/view/...` request fired on initial route load in this pass.
  - Treat this as evidence that the top-level `Klassenbuch` screen is a legacy wrapper on first load, not proof that the route is data-free.

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

### `/contact-details`

- Visible entrypoint: top-level `Kontaktdaten`
- Visible sub-navigation: none beyond the global left navigation in this session
- Observed XHR routes:
  - no dedicated profile read route observed before further interaction
- Section-specific traffic: not observed
- Notes:
  - The route loaded an embedded legacy shell via `https://igs-lilienthal.webuntis.com/WebUntis/embedded.do?showSidebar=true`.
  - No modern `api/rest/view/...` request fired on initial route load in this pass, including `v1/profile/user-contact-data` and `v1/profile/user-email`.
  - That does not invalidate the existing client coverage, but it means the route-level mapping for contact data currently points to a legacy wrapper rather than a modern SPA screen.

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
{ "filters": [], "searchText": "sei" }
```

Drift note:

- The shipped client and current request descriptors in this repository still model message recipient filter/search on the `v1` route family.
- The live compose flow for this tenant and role is already using the `v2` filter endpoint for both the initial recipient list and search text refinement.

## Current Interpretation

- The route map shows a mixed-version frontend rather than a clean all-`v2` migration.
- Top-level list and timetable screens still lean heavily on `v1`.
- Several seemingly missing top-level surfaces are not modern REST screens at all on first load; they currently resolve to legacy `embedded.do` wrappers.
- Newer compose-recipient behavior has already moved at least one live interaction to `v2`.
- The most likely next implementation target is a focused follow-up on message recipient route compatibility, ideally with cross-tenant caution before changing the public client behavior.

## Read-Only Blind Spots

- Route mapping still incomplete:
  - `Kontaktdaten` currently resolves to `/contact-details`, but the route loads a legacy embedded shell and this browser pass did not reveal which interaction actually triggers the proven `profile/user-contact-data` and `profile/user-email` endpoints.
  - `Klassenbuch` resolves to `/absences`, but the shell loads legacy `embedded.do` content before it reveals which endpoints back `Abwesenheiten`, `Fehlzeiten`, `Klassendienste`, or `Befreiungen`.
  - `Unterricht` subviews such as `Lehrkraft`, `Klasse`, `Schüler*in`, `Lehrkraft - Tag`, `Klasse - Tag`, and `Stundenliste Klasse` still need route-by-route probing inside the legacy shell or on directly opened modern subviews.
- Schema follow-up opportunities:
  - The browser evidence around `exams/statistics` suggests a follow-up raw payload capture would be worthwhile to tighten remaining generic shapes such as `countPerGrade`.
