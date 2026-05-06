import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { AppClient } from "../../src/domains/app/index.ts";
import { ClassregClient } from "../../src/domains/classreg/index.ts";
import { ExamsClient } from "../../src/domains/exams/index.ts";
import { MessagesClient } from "../../src/domains/messages/index.ts";
import { ProfileClient } from "../../src/domains/profile/index.ts";
import { SchoolyearsClient } from "../../src/domains/schoolyears/index.ts";
import { SessionClient } from "../../src/domains/session/index.ts";
import { TimetableClient } from "../../src/domains/timetable/index.ts";
import { jsonResponse, makeCoreTestLayer, makeJwt } from "./helpers.ts";

interface ObservedRequest {
  readonly method: string;
  readonly url: URL;
  readonly query: Readonly<Record<string, string>>;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string | undefined;
}

const decodeBody = (body: { readonly _tag: string; readonly body?: unknown }) => {
  if (body._tag === "Empty") {
    return undefined;
  }
  if (body._tag === "Uint8Array" && body.body instanceof Uint8Array) {
    return new TextDecoder().decode(body.body);
  }
  if (body._tag === "Raw") {
    return typeof body.body === "string" ? body.body : JSON.stringify(body.body);
  }

  return undefined;
};

const makeRecorderLayer = (observed: Array<ObservedRequest>) =>
  makeCoreTestLayer((request) => {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/index.do")) {
      return new Response("", {
        status: 200,
        headers: { "set-cookie": "JSESSIONID=seed; Path=/;" },
      });
    }
    if (url.pathname.endsWith("/j_spring_security_check")) {
      return new Response("", {
        status: 302,
        headers: { "set-cookie": "JSESSIONID=login; Path=/;" },
      });
    }
    if (url.pathname.endsWith("/api/token/new")) {
      return new Response(makeJwt(), { status: 200 });
    }
    if (url.pathname.endsWith("/api/rest/view/v1/app/data")) {
      return jsonResponse({
        currentSchoolYear: { id: 7 },
        tenant: { id: "tenant-42" },
      });
    }

    observed.push({
      method: request.method,
      url,
      query: Object.fromEntries(
        Array.from(request.urlParams, ([key, value]) => [key, String(value)]),
      ),
      headers: request.headers,
      body: decodeBody(request.body),
    });

    switch (url.pathname) {
      case "/WebUntis/api/rest/view/v1/app/platform-application/exam-integrations":
        return jsonResponse([
          {
            active: true,
            id: 5,
            menuName: "Gradebook",
            mobileAppLink: false,
            mobileView: false,
            openInTab: true,
            role: "DEFAULT",
            url: "https://example.com/exams",
            viewType: "EXAMLIST",
          },
        ]);
      case "/WebUntis/api/rest/view/v1/onboarding":
        return jsonResponse({
          type: "TIMETABLE",
          time: "08:00",
          step: "timetable",
        });
      case "/WebUntis/api/rest/view/v1/classreg/homework/meta":
        return jsonResponse({
          classes: [{ id: 1, name: "10A", nameShort: "10A" }],
          teachers: [{ id: 2, name: "TCH", nameShort: "TCH" }],
          subjects: [{ id: 3, name: "Math", nameShort: "MA" }],
          schoolYears: [
            {
              id: 7,
              name: "2025/2026",
              dateRange: {
                start: "2026-03-16",
                end: "2026-03-20",
              },
              parentId: 0,
            },
          ],
        });
      case "/WebUntis/api/rest/view/v1/classreg/lesson-topics/meta":
        return jsonResponse({
          teachingMethods: [],
          blockTopicAllowed: true,
          futureTopicAllowed: true,
          oneDriveAllowed: false,
        });
      case "/WebUntis/api/rest/view/v1/classreg/homework/list":
        return jsonResponse({
          homeworkList: [
            {
              attachments: [],
              id: 222,
              createdByUser: "PER",
              lessonId: 14894,
              completed: false,
              date: "2025-08-14",
              dueDate: "2025-08-19",
              remark: "",
              subject: {
                id: 318,
                name: "sn1",
                nameShort: "sn1",
              },
              homework: "Ideen fur ein Video einsammeln.",
            },
          ],
        });
      case "/WebUntis/api/rest/view/v1/exams":
        return jsonResponse({
          exams: [],
          withDeleted: false,
        });
      case "/WebUntis/api/rest/view/v1/exams/filter":
        return jsonResponse({
          examTypes: [],
          subjects: [],
          classes: [],
          teachers: [],
        });
      case "/WebUntis/api/rest/view/v1/exams/statistics":
        return jsonResponse({
          exams: [],
        });
      case "/WebUntis/api/rest/view/v1/exams/42":
        return jsonResponse({
          examId: 42,
          examType: {
            id: 1,
            shortName: "K",
            longName: "Klausur",
            displayName: "Klausur",
            gradingScaleId: 1,
          },
          gradingScale: {
            id: 1,
            shortName: "N",
            longName: "Notes",
            displayName: "Notes",
          },
          examName: "Exam",
          examText: "Exam text",
          examStart: "2026-03-16T08:00:00",
          examEnd: "2026-03-16T09:00:00",
          examDuration: 60,
          examBooked: "2026-03-15T08:00:00",
          examBookedUser: {
            id: 1,
            shortName: "T1",
            longName: "Teacher 1",
            displayName: "Teacher 1",
          },
          examReturned: null,
          examReturnedUser: null,
          examModified: "2026-03-15T09:00:00",
          examModifiedUser: {
            id: 1,
            shortName: "T1",
            longName: "Teacher 1",
            displayName: "Teacher 1",
          },
          numStudents: 0,
          subject: {
            id: 2,
            shortName: "MA",
            longName: "Math",
            displayName: "Math",
          },
          classes: [],
          teachers: [],
          studentgroup: {
            id: 3,
            shortName: "10A",
            longName: "10A",
            displayName: "10A",
          },
          students: [],
          invigilators: [],
          rooms: [],
          lessonId: 1,
          exported: false,
          deleted: false,
          isUntisExam: false,
          canEdit: true,
          canDelete: true,
          canReadGrades: true,
          canWriteGrades: false,
        });
      case "/WebUntis/api/rest/view/v1/messages/permissions":
        return jsonResponse({
          recipientOptions: ["STAFF"],
          allowRequestReadConfirmation: true,
          recipientSearchMaxResult: 25,
          showDraftsTab: true,
          showSentTab: true,
          canForbidReplies: true,
          maxFileSize: 10,
          maxFileCount: 3,
        });
      case "/WebUntis/api/rest/view/v1/messages/recipients/STAFF/filter":
        return jsonResponse({
          filters: [
            {
              type: "STAFF",
              items: ["Teachers"],
            },
          ],
        });
      case "/WebUntis/api/rest/view/v2/messages/recipients/STAFF/filter":
        return jsonResponse({
          users: [
            {
              id: 7,
              displayName: "SEI",
              imageUrl: null,
              role: "TEACHER",
              tags: [],
              className: null,
            },
          ],
        });
      case "/WebUntis/api/rest/view/v1/messages/recipients/STAFF/search":
        return jsonResponse([
          {
            personId: 1,
            className: null,
            displayName: "Anna Teacher",
            imageUrl: null,
            role: "STAFF",
          },
        ]);
      case "/WebUntis/api/rest/view/v1/messages/42":
        return jsonResponse({
          id: 42,
          subject: "Subject",
          content: "Body",
          sender: {
            className: null,
            displayName: "Teacher",
            imageUrl: null,
            userId: 2,
          },
          sentDateTime: "2026-03-16T08:00:00",
          allowMessageDeletion: false,
          attachments: [],
          blobAttachment: null,
          storageAttachments: [],
          isReply: false,
          isReplyAllowed: true,
          isReportMessage: false,
          isReplyForbidden: false,
          replyHistory: [],
          requestConfirmation: null,
        });
      case "/WebUntis/api/rest/view/v1/messages/42/reply-form":
        return jsonResponse({
          subject: "Reply",
          recipient: {
            id: 1,
            className: null,
            displayName: "Teacher",
          },
          replyHistory: [],
        });
      case "/WebUntis/api/rest/view/v1/profile/user-email":
        return jsonResponse({
          email: "teacher@example.com",
        });
      case "/WebUntis/api/rest/view/v1/schoolyears":
        return jsonResponse([
          {
            id: 7,
            name: "2025/2026",
            dateRange: {
              start: "2026-03-16",
              end: "2026-03-20",
            },
          },
        ]);
      case "/WebUntis/api/rest/view/v1/session/status":
        return jsonResponse({
          expiresInMs: 1000,
        });
      case "/WebUntis/api/rest/view/v1/timetable/entries":
        return jsonResponse({
          format: 1,
          days: [
            {
              date: "2026-03-16",
              resourceType: "ROOM",
              resource: {
                id: 1,
                shortName: "R1",
                longName: "Room 1",
                displayName: "Room 1",
              },
              status: "REGULAR",
              dayEntries: [],
              gridEntries: [],
              backEntries: [],
            },
          ],
          errors: [],
        });
      case "/WebUntis/api/rest/view/v1/timetable/entriesWeekOverview":
        return jsonResponse({
          slots: [],
          days: [],
        });
      case "/WebUntis/api/rest/view/v1/timetable/grid":
        return jsonResponse({
          firstDayOfWeek: "MONDAY",
          studentFormat: 1,
          classFormat: 1,
          subjectFormat: 1,
          teacherFormat: 1,
          roomFormat: 1,
          resourceFormat: 1,
          formatDefinitions: [
            {
              id: 1,
              name: "Default",
              longname: "Default",
              showStartEndTimeOfSlots: true,
              showStartEndTime: true,
              showCancellations: true,
              showExternalCalendars: false,
              hideDetails: false,
              minRows: 6,
              duration: {
                start: "08:00",
                end: "13:00",
              },
              timeGridType: "CLOCK_HOURS",
              timeGridDays: ["MONDAY"],
              timeGridSlots: [
                {
                  name: "1",
                  number: 1,
                  duration: {
                    start: "08:00",
                    end: "08:45",
                  },
                },
              ],
            },
          ],
        });
      default:
        return jsonResponse([]);
    }
  });

const getLast = (observed: Array<ObservedRequest>) => {
  const request = observed[observed.length - 1];
  if (request === undefined) {
    throw new Error("Expected at least one observed request");
  }

  return request;
};

describe("request descriptors", () => {
  it.effect("app routes use auth-only policy for onboarding", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const app = yield* AppClient;
      yield* app.getOnboarding({ type: "TIMETABLE" });

      const request = getLast(observed);
      expect(request.method).toBe("GET");
      expect(request.url.pathname).toBe("/WebUntis/api/rest/view/v1/onboarding");
      expect(request.query["type"]).toBe("TIMETABLE");
      expect(request.headers["x-webuntis-api-school-year-id"]).toBeUndefined();
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("app exam integrations routes stay auth-only", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const app = yield* AppClient;
      const integrations = yield* app.getExamIntegrations();

      expect(integrations).toEqual([
        {
          active: true,
          id: 5,
          menuName: "Gradebook",
          mobileAppLink: false,
          mobileView: false,
          openInTab: true,
          role: "DEFAULT",
          url: "https://example.com/exams",
          viewType: "EXAMLIST",
        },
      ]);

      const request = getLast(observed);
      expect(request.method).toBe("GET");
      expect(request.url.pathname).toBe(
        "/WebUntis/api/rest/view/v1/app/platform-application/exam-integrations",
      );
      expect(request.headers["x-webuntis-api-school-year-id"]).toBeUndefined();
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("classreg read-only routes use the proven live contracts", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const classreg = yield* ClassregClient;
      yield* classreg.getHomeworkMeta();

      const homeworkMetaRequest = getLast(observed);
      expect(homeworkMetaRequest.url.pathname).toBe(
        "/WebUntis/api/rest/view/v1/classreg/homework/meta",
      );
      expect(homeworkMetaRequest.headers["x-webuntis-api-school-year-id"]).toBeUndefined();

      yield* classreg.getLessonTopicsMeta();

      const lessonTopicsMetaRequest = getLast(observed);
      expect(lessonTopicsMetaRequest.method).toBe("GET");
      expect(lessonTopicsMetaRequest.url.pathname).toBe(
        "/WebUntis/api/rest/view/v1/classreg/lesson-topics/meta",
      );
      expect(lessonTopicsMetaRequest.headers["x-webuntis-api-school-year-id"]).toBeUndefined();

      yield* classreg.getHomeworkList({
        classId: null,
        teacherId: null,
        subjectId: null,
        dateRange: {
          start: "2025-08-14",
          end: "2026-07-01",
        },
        dateRangeType: "SCHOOLYEAR",
      });

      const homeworkListRequest = getLast(observed);
      expect(homeworkListRequest.method).toBe("POST");
      expect(homeworkListRequest.url.pathname).toBe(
        "/WebUntis/api/rest/view/v1/classreg/homework/list",
      );
      expect(homeworkListRequest.body).toBe(
        JSON.stringify({
          classId: null,
          teacherId: null,
          subjectId: null,
          dateRange: {
            start: "2025-08-14",
            end: "2026-07-01",
          },
          dateRangeType: "SCHOOLYEAR",
        }),
      );
      expect(homeworkListRequest.headers["x-webuntis-api-school-year-id"]).toBeUndefined();
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("exam detail routes use id path segments without school-year headers", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const exams = yield* ExamsClient;
      yield* exams.getExam({ id: 42 });

      const request = getLast(observed);
      expect(request.url.pathname).toBe("/WebUntis/api/rest/view/v1/exams/42");
      expect(request.headers["x-webuntis-api-school-year-id"]).toBeUndefined();
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("exam list routes accept browser-observed date filters", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const exams = yield* ExamsClient;
      yield* exams.list({
        start: "2026-05-04",
        end: "2026-05-10",
        withDeleted: false,
      });

      const listRequest = getLast(observed);
      expect(listRequest.url.pathname).toBe("/WebUntis/api/rest/view/v1/exams");
      expect(listRequest.query["start"]).toBe("2026-05-04");
      expect(listRequest.query["end"]).toBe("2026-05-10");
      expect(listRequest.query["withDeleted"]).toBe("false");

      yield* exams.getFilter({
        start: "2026-05-04",
        end: "2026-05-10",
      });

      const filterRequest = getLast(observed);
      expect(filterRequest.url.pathname).toBe("/WebUntis/api/rest/view/v1/exams/filter");
      expect(filterRequest.query["start"]).toBe("2026-05-04");
      expect(filterRequest.query["end"]).toBe("2026-05-10");

      yield* exams.getStatistics({
        start: "2026-05-04",
        end: "2026-05-10",
      });

      const statisticsRequest = getLast(observed);
      expect(statisticsRequest.url.pathname).toBe("/WebUntis/api/rest/view/v1/exams/statistics");
      expect(statisticsRequest.query["start"]).toBe("2026-05-04");
      expect(statisticsRequest.query["end"]).toBe("2026-05-10");
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("message permissions routes require metadata headers", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const messages = yield* MessagesClient;
      yield* messages.getPermissions();

      const request = getLast(observed);
      expect(request.url.pathname).toBe("/WebUntis/api/rest/view/v1/messages/permissions");
      expect(request.headers["x-webuntis-api-school-year-id"]).toBe("7");
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("message recipient routes keep legacy v1 and additive v2 contracts", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const messages = yield* MessagesClient;
      yield* messages.getRecipientFilter({ recipientOption: "STAFF" });

      const filterRequest = getLast(observed);
      expect(filterRequest.url.pathname).toBe(
        "/WebUntis/api/rest/view/v1/messages/recipients/STAFF/filter",
      );

      yield* messages.filterComposeRecipients({
        recipientOption: "STAFF",
        searchText: "sei",
      });

      const composeRequest = getLast(observed);
      expect(composeRequest.method).toBe("POST");
      expect(composeRequest.url.pathname).toBe(
        "/WebUntis/api/rest/view/v2/messages/recipients/STAFF/filter",
      );
      expect(composeRequest.body).toBe(
        JSON.stringify({
          filters: [],
          searchText: "sei",
        }),
      );
      expect(composeRequest.headers["x-webuntis-api-school-year-id"]).toBeUndefined();

      yield* messages.searchRecipients({
        recipientOption: "STAFF",
        searchText: "anna",
      });

      const searchRequest = getLast(observed);
      expect(searchRequest.url.pathname).toBe(
        "/WebUntis/api/rest/view/v1/messages/recipients/STAFF/search",
      );
      expect(searchRequest.query["searchText"]).toBe("anna");
      expect(searchRequest.headers["x-webuntis-api-school-year-id"]).toBeUndefined();
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("message detail routes use request-object ids", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const messages = yield* MessagesClient;
      yield* messages.getMessage({ id: 42 });

      const detailRequest = getLast(observed);
      expect(detailRequest.url.pathname).toBe("/WebUntis/api/rest/view/v1/messages/42");

      yield* messages.getReplyForm({ id: 42 });

      const replyRequest = getLast(observed);
      expect(replyRequest.url.pathname).toBe("/WebUntis/api/rest/view/v1/messages/42/reply-form");
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("profile email routes require metadata headers", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const profile = yield* ProfileClient;
      yield* profile.getUserEmail();

      const request = getLast(observed);
      expect(request.url.pathname).toBe("/WebUntis/api/rest/view/v1/profile/user-email");
      expect(request.headers["x-webuntis-api-school-year-id"]).toBe("7");
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("schoolyears routes stay auth-only", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const schoolyears = yield* SchoolyearsClient;
      yield* schoolyears.list();

      const request = getLast(observed);
      expect(request.url.pathname).toBe("/WebUntis/api/rest/view/v1/schoolyears");
      expect(request.headers["x-webuntis-api-school-year-id"]).toBeUndefined();
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("session status routes post bodies without school-year headers", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const session = yield* SessionClient;
      yield* session.getStatus({ clientTimeZone: "Europe/Berlin" });

      const request = getLast(observed);
      expect(request.method).toBe("POST");
      expect(request.url.pathname).toBe("/WebUntis/api/rest/view/v1/session/status");
      expect(request.headers["x-webuntis-api-school-year-id"]).toBeUndefined();
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("timetable entry routes encode query params and metadata headers", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const timetable = yield* TimetableClient;
      yield* timetable.getEntries({
        start: "2026-03-16",
        end: "2026-03-20",
        resourceType: "ROOM",
        resources: [1, 2],
        timetableType: "STANDARD",
        format: 3,
        layout: "START_TIME",
        periodTypes: "STANDARD",
      });

      const request = getLast(observed);
      expect(request.url.pathname).toBe("/WebUntis/api/rest/view/v1/timetable/entries");
      expect(request.query["resources"]).toBe("1,2");
      expect(request.query["resourceType"]).toBe("ROOM");
      expect(request.headers["x-webuntis-api-school-year-id"]).toBe("7");
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("timetable grid routes use request-object inputs", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const timetable = yield* TimetableClient;
      yield* timetable.getGrid({ timetableType: "SUBSTITUTION" });

      const request = getLast(observed);
      expect(request.url.pathname).toBe("/WebUntis/api/rest/view/v1/timetable/grid");
      expect(request.query["timetableType"]).toBe("SUBSTITUTION");
      expect(request.headers["x-webuntis-api-school-year-id"]).toBe("7");
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });

  it.effect("timetable week overview matches browser query shape", () => {
    const observed: Array<ObservedRequest> = [];

    return Effect.gen(function* () {
      const timetable = yield* TimetableClient;
      yield* timetable.getEntriesWeekOverview({
        start: "2026-05-04",
        end: "2026-05-08",
        resourceType: "ROOM",
        resources: [],
      });

      const request = getLast(observed);
      expect(request.url.pathname).toBe("/WebUntis/api/rest/view/v1/timetable/entriesWeekOverview");
      expect(request.query["start"]).toBe("2026-05-04");
      expect(request.query["end"]).toBe("2026-05-08");
      expect(request.query["resourceType"]).toBe("ROOM");
      expect(request.query["resources"]).toBe("");
      expect(request.query["timetableType"]).toBeUndefined();
    }).pipe(Effect.provide(makeRecorderLayer(observed)));
  });
});
