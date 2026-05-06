import { describe, expect, it, layer } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import { layer as makeWebUntisLayer, WebUntisClient } from "../../src/client.ts";
import {
  HomeSchema,
  MobileDataSchema,
  MobileDataV1V2Schema,
  StartupActionsSchema,
} from "../../src/domains/schemas.ts";
import { ClientConfig } from "../../src/internal/config.ts";
import { UnexpectedResponseError } from "../../src/internal/errors.ts";
import { RawViewApiClient } from "../../src/internal/raw-view-api.ts";
import { RequestPolicy } from "../../src/internal/request.ts";
import { makeWebUntisRuntimeLayer } from "../../src/internal/runtime.ts";
import { strictJsonParseOptions } from "../../src/internal/schema.ts";
import {
  liveEnvMissing,
  normalizeAppExamIntegrations,
  normalizeAppPlatformApplicationMenus,
  normalizeAppThirdPartyData,
  normalizeClassregAbsencesMeta,
  normalizeClassregHomeworkList,
  normalizeClassregHomeworkMeta,
  normalizeClassregLessonTopicsMeta,
  normalizeDashboardCards,
  normalizeDashboardCardsDetail,
  normalizeDashboardCardsStatus,
  normalizeExamDetail,
  normalizeExamFilter,
  normalizeExamStatistics,
  normalizeExams,
  normalizeHome,
  normalizeMessageComposeRecipients,
  normalizeMessageDetail,
  normalizeMessageDrafts,
  normalizeMessageRecipientFilter,
  normalizeMessageRecipientQuickfilters,
  normalizeMessageRecipientSearch,
  normalizeMessageReplyForm,
  normalizeMessageSent,
  normalizeMessagesInbox,
  normalizeMessagesPermissions,
  normalizeMessagesStatus,
  normalizeMobileData,
  normalizeOnboarding,
  normalizeSessionStatus,
  normalizeStartupActions,
  normalizeTimeGrid,
  normalizeTimetableAvailableRooms,
  normalizeTimetableCalendar,
  normalizeTimetableEntries,
  normalizeTimetableEntriesSettings,
  normalizeTimetableEntriesWeekOverview,
  normalizeTimetableExternalCalendar,
  normalizeTimetableFilter,
  normalizeTimetableGrid,
  normalizeTimetableMenu,
  normalizeTimetableSearch,
  normalizeTodayMeta,
  normalizeUnexpectedResponse,
  normalizeUserContactData,
  normalizeUserEmail,
} from "./support.ts";

const hasLiveEnv = liveEnvMissing.length === 0;

const liveLayer = Layer.unwrap(
  ClientConfig.fromEnv().pipe(
    Effect.map((config) =>
      Layer.mergeAll(makeWebUntisLayer(config), makeWebUntisRuntimeLayer({ config })),
    ),
  ),
);

describe.skipIf(!hasLiveEnv)("live WebUntis integration", () => {
  layer(liveLayer, { excludeTestServices: true })("with live layer", (it) => {
    it.effect(
      "documents current startup v1 and v2 parity",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const rawViewApi = yield* RawViewApiClient;
          const startupActionsV1 = yield* Schema.decodeUnknownEffect(StartupActionsSchema)(
            yield* rawViewApi.getJson("api/rest/view/v1/trigger/startup", {
              policy: RequestPolicy.AuthOnly,
            }),
            strictJsonParseOptions,
          );
          const startupActionsV2 = yield* client.app.getStartupActions();

          expect(startupActionsV1).toEqual(startupActionsV2);
          expect(normalizeStartupActions(startupActionsV1)).toMatchSnapshot();
          expect(normalizeStartupActions(startupActionsV2)).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "documents current home and mobile version behavior",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const rawViewApi = yield* RawViewApiClient;
          const homeV1 = yield* Schema.decodeUnknownEffect(HomeSchema)(
            yield* rawViewApi.getJson("api/rest/view/v1/home", {
              policy: RequestPolicy.AuthOnly,
            }),
            strictJsonParseOptions,
          );
          const homeV2 = yield* client.app.getHome();
          const mobileDataV1 = yield* Schema.decodeUnknownEffect(MobileDataV1V2Schema)(
            yield* rawViewApi.getJson("api/rest/view/v1/mobile/data", {
              policy: RequestPolicy.AuthOnly,
            }),
            strictJsonParseOptions,
          );
          const mobileDataV2 = yield* Schema.decodeUnknownEffect(MobileDataV1V2Schema)(
            yield* rawViewApi.getJson("api/rest/view/v2/mobile/data", {
              policy: RequestPolicy.AuthOnly,
            }),
            strictJsonParseOptions,
          );
          const mobileDataV3 = yield* Schema.decodeUnknownEffect(MobileDataSchema)(
            yield* rawViewApi.getJson("api/rest/view/v3/mobile/data", {
              policy: RequestPolicy.AuthOnly,
            }),
            strictJsonParseOptions,
          );
          const clientMobileData = yield* client.app.getMobileData();
          const { schoolLoginName: _schoolLoginName, ...mobileDataV3TenantWithoutSchoolLoginName } =
            mobileDataV3.tenant;

          expect(homeV1).not.toEqual(homeV2);
          expect(mobileDataV1).toEqual(mobileDataV2);
          expect(mobileDataV3).not.toEqual(mobileDataV1);
          expect(clientMobileData).toEqual(mobileDataV3);
          expect(mobileDataV3.tenant.schoolLoginName.length).toBeGreaterThan(0);
          expect({
            ...mobileDataV3,
            tenant: mobileDataV3TenantWithoutSchoolLoginName,
          }).toEqual(mobileDataV1);
          expect(normalizeHome(homeV1)).toMatchSnapshot();
          expect(normalizeHome(homeV2)).toMatchSnapshot();
          expect(normalizeMobileData(mobileDataV1)).toMatchSnapshot();
          expect(normalizeMobileData(mobileDataV2)).toMatchSnapshot();
          expect(normalizeMobileData(mobileDataV3)).toMatchSnapshot();
          expect(normalizeMobileData(clientMobileData)).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "reads additional app bootstrap endpoints",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const todayMeta = yield* client.app.getTodayMeta();
          const dashboardCards = yield* client.app.getDashboardCards();
          const dashboardCardsDetail = yield* client.app.getDashboardCardsDetail();
          const dashboardCardsStatus = yield* client.app.getDashboardCardsStatus();
          const menus = yield* client.app.getPlatformApplicationMenus();
          const examIntegrations = yield* client.app.getExamIntegrations();
          const thirdPartyData = yield* client.app.getThirdPartyData();
          const onboarding = yield* client.app.getOnboarding({
            type: "TIMETABLE",
          });

          expect(todayMeta.greetingName.length).toBeGreaterThan(0);
          expect(Array.isArray(dashboardCards.dashboardCards)).toBe(true);
          expect(Array.isArray(dashboardCardsDetail.dashboardCardsDetails)).toBe(true);
          expect(dashboardCardsStatus.unreadCardsCount).toBeGreaterThanOrEqual(0);
          expect(menus.length).toBeGreaterThan(0);
          expect(Array.isArray(examIntegrations)).toBe(true);
          expect(thirdPartyData).toHaveProperty("sleekplanToken");
          expect(onboarding.type).toBe("TIMETABLE");
          expect(normalizeTodayMeta(todayMeta)).toMatchSnapshot();
          expect(normalizeDashboardCards(dashboardCards)).toMatchSnapshot();
          expect(normalizeDashboardCardsDetail(dashboardCardsDetail)).toMatchSnapshot();
          expect(normalizeDashboardCardsStatus(dashboardCardsStatus)).toMatchSnapshot();
          expect(normalizeAppPlatformApplicationMenus(menus)).toMatchSnapshot();
          expect(normalizeAppExamIntegrations(examIntegrations)).toMatchSnapshot();
          expect(normalizeAppThirdPartyData(thirdPartyData)).toMatchSnapshot();
          expect(normalizeOnboarding(onboarding)).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "reads schoolyears and message endpoints",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const schoolyears = yield* client.schoolyears.list();
          const inbox = yield* client.messages.getInbox();
          const drafts = yield* client.messages.getDrafts();
          const messagePermissions = yield* client.messages.getPermissions();
          const quickfilters = yield* client.messages.getRecipientQuickfilters();
          const staffFilter = yield* client.messages.getRecipientFilter({
            recipientOption: "STAFF",
          });
          const composeRecipients = yield* client.messages.filterComposeRecipients({
            recipientOption: "STAFF",
            searchText: "sei",
          });
          const staffSearch = yield* client.messages.searchRecipients({
            recipientOption: "STAFF",
            searchText: "a",
          });
          const sent = yield* client.messages.getSent();
          const messageStatus = yield* client.messages.getStatus();
          const messageId = inbox.incomingMessages[0]?.id;

          expect(schoolyears.length).toBeGreaterThan(0);
          expect(staffFilter.filters.length).toBeGreaterThan(0);
          expect(composeRecipients.users.length).toBeGreaterThan(0);

          expect(normalizeMessagesInbox(inbox)).toMatchSnapshot();
          expect(normalizeMessageDrafts(drafts)).toMatchSnapshot();
          expect(normalizeMessagesPermissions(messagePermissions)).toMatchSnapshot();
          expect(normalizeMessageRecipientQuickfilters(quickfilters)).toMatchSnapshot();
          expect(normalizeMessageRecipientFilter(staffFilter)).toMatchSnapshot();
          expect(normalizeMessageComposeRecipients(composeRecipients)).toMatchSnapshot();
          expect(normalizeMessageRecipientSearch(staffSearch)).toMatchSnapshot();
          expect(normalizeMessageSent(sent)).toMatchSnapshot();
          expect(normalizeMessagesStatus(messageStatus)).toMatchSnapshot();

          if (messageId !== undefined) {
            const detail = yield* client.messages.getMessage({ id: messageId });
            const replyForm = yield* client.messages.getReplyForm({
              id: messageId,
            });

            expect(normalizeMessageDetail(detail)).toMatchSnapshot();
            expect(normalizeMessageReplyForm(replyForm)).toMatchSnapshot();
          }
        }),
      30_000,
    );

    it.effect(
      "reads classreg meta and homework endpoints",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const appData = yield* client.app.getData();
          const absencesMeta = yield* client.classreg.getAbsencesMeta();
          const homeworkMeta = yield* client.classreg.getHomeworkMeta();
          const lessonTopicsMeta = yield* client.classreg.getLessonTopicsMeta();
          const homeworkList = yield* client.classreg.getHomeworkList({
            classId: null,
            teacherId: null,
            subjectId: null,
            dateRange: appData.currentSchoolYear.dateRange,
            dateRangeType: "SCHOOLYEAR",
          });

          expect(absencesMeta.classes.length).toBeGreaterThan(0);
          expect(absencesMeta.reasons.length).toBeGreaterThan(0);
          expect(absencesMeta.excuseStatuses.length).toBeGreaterThan(0);
          expect(homeworkMeta.classes.length).toBeGreaterThan(0);
          expect(homeworkMeta.teachers.length).toBeGreaterThan(0);
          expect(homeworkMeta.subjects.length).toBeGreaterThan(0);
          expect(homeworkMeta.schoolYears.length).toBeGreaterThan(0);
          expect(Array.isArray(lessonTopicsMeta.teachingMethods)).toBe(true);
          expect(homeworkList.homeworkList.length).toBeGreaterThan(0);
          expect(normalizeClassregAbsencesMeta(absencesMeta)).toMatchSnapshot();
          expect(normalizeClassregHomeworkMeta(homeworkMeta)).toMatchSnapshot();
          expect(normalizeClassregLessonTopicsMeta(lessonTopicsMeta)).toMatchSnapshot();
          expect(normalizeClassregHomeworkList(homeworkList)).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "reads exam endpoints",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const exams = yield* client.exams.list();
          const filter = yield* client.exams.getFilter();
          const statistics = yield* client.exams.getStatistics();
          const examId = exams.exams[0]?.examId;

          expect(exams.exams.length).toBeGreaterThan(0);
          expect(filter.examTypes.length).toBeGreaterThan(0);
          expect(statistics.exams.length).toBeGreaterThan(0);
          expect(examId).toBeDefined();
          if (examId === undefined) {
            throw new Error("Expected at least one exam");
          }
          const detail = yield* client.exams.getExam({ id: examId });

          expect(normalizeExams(exams)).toMatchSnapshot();
          expect(normalizeExamFilter(filter)).toMatchSnapshot();
          expect(normalizeExamStatistics(statistics)).toMatchSnapshot();
          expect(normalizeExamDetail(detail)).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "reads user contact endpoints",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const contactData = yield* client.profile.getUserContactData();
          const email = yield* client.profile.getUserEmail();

          expect(contactData).toHaveProperty("email");
          expect(email.email).toContain("@");
          expect(normalizeUserContactData(contactData)).toMatchSnapshot();
          expect(normalizeUserEmail(email)).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "documents current upstream profile summary/admin failures",
      () =>
        Effect.gen(function* () {
          const rawViewApi = yield* RawViewApiClient;
          const profileError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/profile", {
              policy: RequestPolicy.AuthOnly,
            }),
          );
          const adminDetailsError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/profile/admin/details", {
              policy: RequestPolicy.AuthOnly,
            }),
          );

          expect(profileError).toBeInstanceOf(UnexpectedResponseError);
          expect(adminDetailsError).toBeInstanceOf(UnexpectedResponseError);
          expect(
            normalizeUnexpectedResponse(profileError as UnexpectedResponseError),
          ).toMatchSnapshot();
          expect(
            normalizeUnexpectedResponse(adminDetailsError as UnexpectedResponseError),
          ).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "reads session status and timetable discovery endpoints",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const appData = yield* client.app.getData();
          const status = yield* client.session.getStatus();
          const menu = yield* client.timetable.getMenu();
          const calendar = yield* client.timetable.getCalendar();
          const search = yield* client.timetable.search({
            query: "10",
            schoolyear: appData.currentSchoolYear.id,
          });
          const availableRooms = yield* client.timetable.getAvailableRooms({
            startDateTime: "2026-03-13T08:00:00",
            endDateTime: "2026-03-13T10:00:00",
          });

          expect(status.expiresInMs).toBeGreaterThanOrEqual(0);
          expect(search.results.length).toBeGreaterThan(0);
          expect(availableRooms.length).toBeGreaterThan(0);
          expect(normalizeSessionStatus(status)).toMatchSnapshot();
          expect(normalizeTimetableMenu(menu)).toMatchSnapshot();
          expect(normalizeTimetableSearch(search)).toMatchSnapshot();
          expect(normalizeTimetableCalendar(calendar)).toMatchSnapshot();
          expect(normalizeTimetableAvailableRooms(availableRooms)).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "reads additional timetable overview endpoints",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const roomFilter = yield* client.timetable.getFilter({
            start: "2026-03-16",
            end: "2026-03-20",
            resourceType: "ROOM",
            timetableType: "OVERVIEW_WEEK",
          });
          const roomId = (
            roomFilter.rooms.find((room) => room.room.shortName === "1.12") ?? roomFilter.rooms[0]
          )?.room.id;
          if (roomId === undefined) {
            throw new Error("Expected at least one room");
          }
          const timegrid = yield* client.timetable.getTimeGrid();
          const weekOverview = yield* client.timetable.getEntriesWeekOverview({
            start: "2026-03-16",
            end: "2026-03-20",
            resourceType: "ROOM",
            resources: [roomId],
          });
          const externalCalendar = yield* client.timetable.getExternalCalendar({
            myTimetable: true,
          });

          expect(roomId).toBeDefined();
          expect(timegrid.units.length).toBeGreaterThan(0);
          expect(weekOverview.slots.length).toBeGreaterThan(0);
          expect(weekOverview.days.length).toBeGreaterThan(0);
          expect(Array.isArray(externalCalendar)).toBe(true);
          expect(normalizeTimeGrid(timegrid)).toMatchSnapshot();
          expect(normalizeTimetableEntriesWeekOverview(weekOverview)).toMatchSnapshot();
          expect(normalizeTimetableExternalCalendar(externalCalendar)).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "documents current timetable utility/settings access behavior",
      () =>
        Effect.gen(function* () {
          const rawViewApi = yield* RawViewApiClient;
          const formatListError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/timetable/settings/format/list", {
              policy: RequestPolicy.AuthOnly,
            }),
          );
          const generalSettingsError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/timetable/settings/general", {
              policy: RequestPolicy.AuthOnly,
            }),
          );
          const visibilityRestrictionError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/timetable/settings/visibilityRestriction", {
              policy: RequestPolicy.AuthOnly,
            }),
          );

          expect(formatListError).toBeInstanceOf(UnexpectedResponseError);
          expect(generalSettingsError).toBeInstanceOf(UnexpectedResponseError);
          expect(visibilityRestrictionError).toBeInstanceOf(UnexpectedResponseError);
          expect(
            normalizeUnexpectedResponse(formatListError as UnexpectedResponseError),
          ).toMatchSnapshot();
          expect(
            normalizeUnexpectedResponse(generalSettingsError as UnexpectedResponseError),
          ).toMatchSnapshot();
          expect(
            normalizeUnexpectedResponse(visibilityRestrictionError as UnexpectedResponseError),
          ).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "documents current blocked or unstable read-only endpoints",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const rawViewApi = yield* RawViewApiClient;
          const roomFilter = yield* client.timetable.getFilter({
            start: "2026-03-16",
            end: "2026-03-16",
            resourceType: "ROOM",
          });
          const teacherFilter = yield* client.timetable.getFilter({
            start: "2026-03-16",
            end: "2026-03-16",
            resourceType: "TEACHER",
          });
          const subjectFilter = yield* client.timetable.getFilter({
            start: "2026-03-16",
            end: "2026-03-16",
            resourceType: "SUBJECT",
          });
          const roomId = (
            roomFilter.rooms.find((room) => room.room.shortName === "1.12") ?? roomFilter.rooms[0]
          )?.room.id;
          const teacherId = teacherFilter.teachers[0]?.teacher.id;
          const subjectId = subjectFilter.subjects[0]?.subject.id;
          expect(roomId).toBeDefined();
          expect(teacherId).toBeDefined();
          expect(subjectId).toBeDefined();
          const messagesOfTheDayError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/messages-of-the-day", {
              policy: RequestPolicy.AuthOnly,
            }),
          );
          const staticTeachersError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/messages/recipients/static/teachers", {
              policy: RequestPolicy.AuthOnly,
            }),
          );
          const staticUsersError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/messages/recipients/static/users", {
              policy: RequestPolicy.AuthOnly,
            }),
          );
          const staticPersonsError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/messages/recipients/static/persons", {
              policy: RequestPolicy.AuthOnly,
            }),
          );
          const messagesOfTheDayFormError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/messages-of-the-day/form", {
              policy: RequestPolicy.AuthOnly,
            }),
          );
          const roomsError = yield* Effect.flip(rawViewApi.getJson("api/rest/view/v1/rooms"));
          const roomDetailError = yield* Effect.flip(
            rawViewApi.getJson(`api/rest/view/v1/rooms/${roomId}`),
          );
          const buildingsError = yield* Effect.flip(
            rawViewApi.getJson("api/rest/view/v1/buildings"),
          );
          const teachersError = yield* Effect.flip(rawViewApi.getJson("api/rest/view/v1/teachers"));
          const teacherDetailError = yield* Effect.flip(
            rawViewApi.getJson(`api/rest/view/v1/teachers/${teacherId}`),
          );
          const subjectsError = yield* Effect.flip(rawViewApi.getJson("api/rest/view/v1/subjects"));
          const subjectDetailError = yield* Effect.flip(
            rawViewApi.getJson(`api/rest/view/v1/subjects/${subjectId}`),
          );

          for (const error of [
            messagesOfTheDayError,
            staticTeachersError,
            staticUsersError,
            staticPersonsError,
            messagesOfTheDayFormError,
            roomsError,
            roomDetailError,
            buildingsError,
            teachersError,
            teacherDetailError,
            subjectsError,
            subjectDetailError,
          ]) {
            expect(error).toBeInstanceOf(UnexpectedResponseError);
            expect(normalizeUnexpectedResponse(error as UnexpectedResponseError)).toMatchSnapshot();
          }
        }),
      30_000,
    );

    it.effect(
      "reads timetable endpoints using the first discovered class",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const appData = yield* client.app.getData();
          const start = new Date().toISOString().slice(0, 10);
          const end = start;
          const filter = yield* client.timetable.getFilter({
            start,
            end,
            resourceType: "CLASS",
          });
          const classId = filter.classes[0]?.class.id;
          expect(classId).toBeDefined();
          if (classId === undefined) {
            throw new Error("Expected at least one class");
          }

          const grid = yield* client.timetable.getGrid();
          const settings = yield* client.timetable.getEntriesSettings({
            resourceType: "CLASS",
          });
          const entries = yield* client.timetable.getEntries({
            start,
            end,
            resourceType: "CLASS",
            resources: [classId],
          });

          expect(appData.currentSchoolYear.id).toBeGreaterThan(0);
          expect(normalizeTimetableGrid(grid)).toMatchSnapshot();
          expect(normalizeTimetableFilter(filter)).toMatchSnapshot();
          expect(normalizeTimetableEntriesSettings(settings)).toMatchSnapshot();
          expect(normalizeTimetableEntries(entries)).toMatchSnapshot();
        }),
      30_000,
    );
  });
});

describe.skipIf(hasLiveEnv)("live WebUntis integration", () => {
  it("documents the required environment variables", () => {
    expect(liveEnvMissing).toEqual(
      expect.arrayContaining(["WEBUNTIS_SCHOOL_NAME", "WEBUNTIS_USERNAME", "WEBUNTIS_PASSWORD"]),
    );
  });
});
