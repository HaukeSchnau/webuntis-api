# Read-Only Blind Spots: Inactive School Year

Observed on 2026-07-14 against the live IGS Lilienthal tenant with an authenticated
staff account. The browser pass only navigated and issued GET/read requests apart
from the required login.

## Inactive-Year Contract

The tenant had no active school year. The SPA displayed `Schuljahr N/A` and a
`Kein Schuljahr aktiv` notice.

- `GET /WebUntis/api/rest/view/v1/app/data` returned
  `currentSchoolYear: null`.
- `GET /WebUntis/api/rest/view/v1/mobile/data`, `v2/mobile/data`, and
  `v3/mobile/data` returned `schoolYear: null`.
- `GET /WebUntis/api/rest/view/v1/timegrid` remained available without a
  school-year header and described the most recent grid.
- The SPA omitted `X-Webuntis-Api-School-Year-Id` while no year was active. The
  API client must therefore treat school-year request metadata as optional; a
  historical `timegrid.schoolyearId` is not an active-year substitute.

The public app/mobile schemas now model those nullable fields, and metadata-bound
requests omit the school-year header in this state.

## Runtime Route Pass

Fresh full-page navigation produced these section reads in addition to the common
bootstrap requests:

- `/messages/inbox`: `GET v1/messages`, `GET v1/messages/status`
- `/messages/sent`: `GET v1/messages/sent`
- `/messages/drafts`: `GET v1/messages/drafts`
- `/homework`: `GET v1/classreg/homework/meta`,
  `POST v1/classreg/homework/list`

The timetable route did not issue timetable data reads without an active year.
The exams and exam-statistics routes attempted their normal endpoints with
`start=Invalid Date&end=Invalid Date`, which the server rejected with `400`. This
is a frontend inactive-year bug, not an API contract to emulate.

Legacy wrapper routes (`/absences`, `/contact-details`, and `/teacher-lessons`)
again exposed only the common modern bootstrap traffic before delegating to
`embedded.do`.

## Bundle Comparison

The active SPA bundle was
`https://igs-lilienthal.webuntis.com/assets/index-Bzf1Gf3l.js`.

The 254 literal `/api/rest/view/...` route strings matched the March catalog. The
two additional catalog entries are the non-view session/token routes, leaving the
catalog total at 256. No literal modern REST routes were added or removed in this
bundle revision.

## Schema Tightening

Previously captured non-empty dashboard payloads provide stable field evidence
for dashboard card summaries and detail items. Those schemas now reject missing
or excess top-level fields instead of accepting arbitrary JSON objects.

The remaining loose fields still lack non-empty evidence in this tenant state:

- class-register `assignmentGroups` and `teachingMethods`
- exam statistics `countPerGrade`
- message recipient `tags`, attachments, reply history, and confirmations
- several timetable entry, filter-selection, integration, and external-calendar
  objects

These should remain structured JSON boundaries until a live non-empty payload or
another authoritative source establishes their field contracts.

## Remaining Exploration Limits

- With no active school year, the UI cannot exercise timetable screens or
  date-dependent class-register/exam paths normally.
- Several master-data routes remain permission-gated for this staff account.
- The legacy iframe surfaces require a separate, carefully scoped read-only pass
  if their classic form/query contracts are to become public client APIs.
