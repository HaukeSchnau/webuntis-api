# Read-Only Blind Spots

Observed on 2026-05-05 against the live IGS Lilienthal tenant with the
read-only browser constraint: navigate and load data only, no server-state
changes beyond login.

## Modern REST Drift

- `GET /WebUntis/api/rest/view/v1/exams`
  - The exams route loaded it with `start`, `end`, and `withDeleted=false`.
  - The client now accepts those query parameters.
- `GET /WebUntis/api/rest/view/v1/exams/filter`
  - The exams and exam-statistics routes loaded it both without dates and with
    `start`/`end`.
  - The client now accepts those query parameters.
- `GET /WebUntis/api/rest/view/v1/exams/statistics`
  - The exam-statistics route loaded it with `start`/`end`.
  - The client now accepts those query parameters.
- `GET /WebUntis/api/rest/view/v1/timetable/entriesWeekOverview`
  - Week overview routes loaded it without a `timetableType` query parameter.
  - The client now omits `timetableType` unless callers provide one.

## Legacy Iframe Read Surfaces

These routes did not emit new modern `api/rest/view` reads for their primary
content. They load `embedded.do` and then legacy read endpoints inside the
iframe:

- `/profile`
  - `/WebUntis/api/profile/config`
  - `/WebUntis/api/profile/languages`
  - `/WebUntis/api/profile/general`
- `/contact-details`
  - `/WebUntis/api/user/persons`
- `/absences`
  - `/WebUntis/absencelist.do`
- `/absence-times`
  - `/WebUntis/absencetimes.do`
- `/class-services`
  - `/WebUntis/jsonrpc_web/jsonStudentDutyService`
- `/exemptions`
  - `/WebUntis/exemptionlist.do`
- `/class-register-reports`
  - `/WebUntis/classregreportsform.do`
- `/teacher-lessons`
  - `/WebUntis/lessonlist.do`
- `/class-lessons`
  - `/WebUntis/lessonweeklist.do`
- `/student-lessons`
  - `/WebUntis/lessonstudentweeklist.do`
- `/daily-teacher-lessons`
  - `/WebUntis/lessonteacherlist.do`
- `/daily-class-lessons`
  - `/WebUntis/lessonklasselist.do`
- `/yearly-teacher-lessons`
  - `/WebUntis/yearlylessonteacherlist.do`
- `/yearly-class-lessons`
  - `/WebUntis/yearlylessonklasselist.do`
- `/students`
  - `/WebUntis/studentlist.do`
- `/departments`
  - `/WebUntis/departmentlist.do`
- `/teachers`
  - `/WebUntis/teacherlist.do`
- `/rooms`
  - `/WebUntis/roomlist.do`
- `/messages-of-the-day`
  - `/WebUntis/messagedaylist.do`

## Permission-Gated Modern Routes

Direct navigation caused the SPA to attempt these modern reads before showing a
not-authorized route for this account:

- `GET /WebUntis/api/rest/view/v1/subjects?departmentId=0`
- `GET /WebUntis/api/rest/view/v1/subjects/form`
- `GET /WebUntis/api/rest/view/v1/buildings`
- `GET /WebUntis/api/rest/view/v1/buildings/form`
- `GET /WebUntis/api/rest/view/v1/excuse-status`

These are candidates for future read-only master-data clients, but this tenant
role returned `403` when replayed with browser auth headers.

## Schema Tightening Evidence

The live `app/data` payload currently includes stable shapes for:

- `oneDriveData`: `hasOneDriveRight`, `oneDriveClientVersion`,
  `oneDriveClientId`
- `user.person`: `displayName`, `id`, `imageUrl`

The public schemas now model those fields directly. Empty live arrays still
need more evidence before tightening:

- `departments`
- `pollingJobs`
- `user.students`
- `exams.statistics[].countPerGrade`
