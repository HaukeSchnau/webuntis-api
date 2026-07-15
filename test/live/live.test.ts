import { describe, expect, it, layer } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import { makeWebUntisResearchLayer, WebUntisClient } from "../../src/client.ts";
import {
  HomeSchema,
  MobileDataSchema,
  type Schoolyear,
  StartupActionsSchema,
} from "../../src/domains/schemas.ts";
import { MobileDataV1V2Schema } from "../../src/domains/app/schema.ts";
import { ClientConfig } from "../../src/internal/config.ts";
import { UnexpectedResponseError } from "../../src/internal/errors.ts";
import { RawViewApiClient } from "../../src/internal/raw-view-api.ts";
import { RequestPolicy } from "../../src/internal/request.ts";
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

const historicalDataWindow = {
  start: "2026-03-16",
  end: "2026-03-20",
} as const;

const requireHistoricalSchoolyear = (schoolyears: ReadonlyArray<Schoolyear>): Schoolyear => {
  const schoolyear = schoolyears.find(
    ({ dateRange }) =>
      dateRange.start <= historicalDataWindow.start && dateRange.end >= historicalDataWindow.end,
  );

  if (schoolyear === undefined) {
    throw new Error(`Expected an advertised school year containing ${historicalDataWindow.start}`);
  }

  return schoolyear;
};

const timetableEntryCount = (
  responses: ReadonlyArray<{
    readonly days: ReadonlyArray<{
      readonly dayEntries: ReadonlyArray<unknown>;
      readonly gridEntries: ReadonlyArray<unknown>;
      readonly backEntries: ReadonlyArray<unknown>;
    }>;
  }>,
) =>
  responses.reduce(
    (responseCount, response) =>
      responseCount +
      response.days.reduce(
        (dayCount, day) =>
          dayCount + day.dayEntries.length + day.gridEntries.length + day.backEntries.length,
        0,
      ),
    0,
  );

const liveLayer = Layer.unwrap(
  ClientConfig.fromEnv().pipe(Effect.map((config) => makeWebUntisResearchLayer(config))),
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
          const startupActionsV2 = yield* client.app.getStartupActions;

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
          const homeV2 = yield* client.app.getHome;
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
          const clientMobileData = yield* client.app.getMobileData;
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
          const todayMeta = yield* client.app.getTodayMeta;
          const dashboardCards = yield* client.app.getDashboardCards;
          const dashboardCardsDetail = yield* client.app.getDashboardCardsDetail;
          const dashboardCardsStatus = yield* client.app.getDashboardCardsStatus;
          const menus = yield* client.app.getPlatformApplicationMenus;
          const examIntegrations = yield* client.app.getExamIntegrations;
          const thirdPartyData = yield* client.app.getThirdPartyData;
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
          const schoolyears = yield* client.schoolyears.list;
          const inbox = yield* client.messages.getInbox;
          const drafts = yield* client.messages.getDrafts;
          const messagePermissions = yield* client.messages.getPermissions;
          const quickfilters = yield* client.messages.getRecipientQuickfilters;
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
          const sent = yield* client.messages.getSent;
          const messageStatus = yield* client.messages.getStatus;
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
          const schoolyears = yield* client.schoolyears.list;
          const historicalSchoolyear = requireHistoricalSchoolyear(schoolyears);
          const { absencesMeta, homeworkList, homeworkMeta, lessonTopicsMeta } = yield* Effect.gen(
            function* () {
              const absencesMeta = yield* client.classreg.getAbsencesMeta;
              const homeworkMeta = yield* client.classreg.getHomeworkMeta;
              const lessonTopicsMeta = yield* client.classreg.getLessonTopicsMeta;
              const homeworkList = yield* client.classreg.getHomeworkList({
                classId: null,
                teacherId: null,
                subjectId: null,
                dateRange: historicalSchoolyear.dateRange,
                dateRangeType: "SCHOOLYEAR",
              });
              return { absencesMeta, homeworkList, homeworkMeta, lessonTopicsMeta };
            },
          ).pipe(client.withSchoolYear(historicalSchoolyear.id));

          expect(absencesMeta.classes.length).toBeGreaterThan(0);
          expect(Array.isArray(absencesMeta.reasons)).toBe(true);
          expect(Array.isArray(absencesMeta.excuseStatuses)).toBe(true);
          expect(homeworkMeta.classes.length).toBeGreaterThan(0);
          expect(Array.isArray(homeworkMeta.teachers)).toBe(true);
          expect(Array.isArray(homeworkMeta.subjects)).toBe(true);
          expect(Array.isArray(homeworkMeta.schoolYears)).toBe(true);
          expect(Array.isArray(lessonTopicsMeta.teachingMethods)).toBe(true);
          expect(homeworkList.homeworkList.length).toBeGreaterThan(0);
          expect(normalizeClassregAbsencesMeta(absencesMeta)).toMatchSnapshot();
          expect(
            normalizeClassregHomeworkMeta({
              ...homeworkMeta,
              classes: homeworkMeta.classes.slice(0, 5),
              schoolYears: homeworkMeta.schoolYears.slice(0, 5),
              subjects: homeworkMeta.subjects.slice(0, 5),
              teachers: homeworkMeta.teachers.slice(0, 5),
            }),
          ).toMatchSnapshot();
          expect(normalizeClassregLessonTopicsMeta(lessonTopicsMeta)).toMatchSnapshot();
          expect(
            normalizeClassregHomeworkList({
              ...homeworkList,
              homeworkList: homeworkList.homeworkList.slice(0, 5),
            }),
          ).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "reads non-empty exam data from a historical school year",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const schoolyears = yield* client.schoolyears.list;
          const historicalSchoolyear = requireHistoricalSchoolyear(schoolyears);
          const { detail, exams, filter, statistics } = yield* Effect.gen(function* () {
            const exams = yield* client.exams.list(historicalSchoolyear.dateRange);
            const filter = yield* client.exams.getFilter(historicalSchoolyear.dateRange);
            const statistics = yield* client.exams.getStatistics(historicalSchoolyear.dateRange);
            const examId = exams.exams[0]?.examId;
            if (examId === undefined) {
              throw new Error("Expected at least one historical exam");
            }
            const detail = yield* client.exams.getExam({ id: examId });
            return { detail, exams, filter, statistics };
          }).pipe(client.withSchoolYear(historicalSchoolyear.id));

          expect(exams.exams.length).toBeGreaterThan(0);
          expect(filter.classes.length).toBeGreaterThan(0);
          expect(statistics.exams.length).toBe(exams.exams.length);
          expect(
            normalizeExamFilter({
              classes: filter.classes.slice(0, 5),
              examTypes: filter.examTypes.slice(0, 5),
              subjects: filter.subjects.slice(0, 5),
              teachers: filter.teachers.slice(0, 5),
            }),
          ).toMatchSnapshot();
          expect(normalizeExamDetail(detail)).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "reads representative non-empty data from the historical school year",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const schoolyears = yield* client.schoolyears.list;
          const schoolyear = requireHistoricalSchoolyear(schoolyears);
          const result = yield* Effect.gen(function* () {
            const exams = yield* client.exams.list(schoolyear.dateRange);
            const statistics = yield* client.exams.getStatistics(schoolyear.dateRange);
            const filter = yield* client.timetable.getFilter({
              ...historicalDataWindow,
              resourceType: "CLASS",
            });
            const grid = yield* client.timetable.getGrid();
            const search = yield* client.timetable.search({
              query: "10",
              schoolyear: schoolyear.id,
            });
            const absencesMeta = yield* client.classreg.getAbsencesMeta;
            const homeworkMeta = yield* client.classreg.getHomeworkMeta;

            return {
              absenceClassCount: absencesMeta.classes.length,
              classCount: filter.classes.length,
              examCount: exams.exams.length,
              gridFormatCount: grid.formatDefinitions.length,
              homeworkClassCount: homeworkMeta.classes.length,
              schoolYearId: schoolyear.id,
              searchResultCount: search.results.length,
              statisticCount: statistics.exams.length,
            };
          }).pipe(client.withSchoolYear(schoolyear.id));

          expect(result.schoolYearId).toBeGreaterThan(0);
          expect(result.examCount).toBeGreaterThan(0);
          expect(result.statisticCount).toBe(result.examCount);
          expect(result.classCount).toBeGreaterThan(0);
          expect(result.searchResultCount).toBeGreaterThan(0);
          expect(result.gridFormatCount).toBeGreaterThan(0);
          expect(result.absenceClassCount).toBeGreaterThan(0);
          expect(result.homeworkClassCount).toBeGreaterThan(0);
        }),
      60_000,
    );

    it.effect(
      "decodes non-empty timetable entries from a historical school year",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const schoolyears = yield* client.schoolyears.list;
          const historicalSchoolyear = requireHistoricalSchoolyear(schoolyears);

          const entryResponses = yield* Effect.gen(function* () {
            const filter = yield* client.timetable.getFilter({
              ...historicalDataWindow,
              resourceType: "CLASS",
            });
            const [firstClassId, ...remainingClassIds] = filter.classes
              .slice(0, 12)
              .map((item) => item.class.id);
            if (firstClassId === undefined) {
              throw new Error("Expected at least one historical class");
            }
            const classIds: [number, ...Array<number>] = [firstClassId, ...remainingClassIds];

            return yield* Effect.forEach(
              [
                ["2025-09-15", "2025-09-19"],
                ["2026-01-19", "2026-01-23"],
                ["2026-03-16", "2026-03-20"],
              ] as const,
              ([start, end]) =>
                client.timetable.getEntries({
                  start,
                  end,
                  resourceType: "CLASS",
                  resources: classIds,
                }),
              { concurrency: 3 },
            );
          }).pipe(client.withSchoolYear(historicalSchoolyear.id));

          const entryCount = timetableEntryCount(entryResponses);
          expect(entryCount).toBeGreaterThan(0);
        }),
      60_000,
    );

    it.effect(
      "reads user contact endpoints",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const contactData = yield* client.profile.getUserContactData;
          const email = yield* client.profile.getUserEmail;

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
          const schoolyears = yield* client.schoolyears.list;
          const historicalSchoolyear = requireHistoricalSchoolyear(schoolyears);
          const status = yield* client.session.getStatus();
          const { availableRooms, calendar, menu, search } = yield* Effect.gen(function* () {
            const menu = yield* client.timetable.getMenu;
            const calendar = yield* client.timetable.getCalendar();
            const search = yield* client.timetable.search({
              query: "10",
              schoolyear: historicalSchoolyear.id,
            });
            const availableRooms = yield* client.timetable.getAvailableRooms({
              startDateTime: "2026-03-13T08:00:00",
              endDateTime: "2026-03-13T10:00:00",
            });
            return { availableRooms, calendar, menu, search };
          }).pipe(client.withSchoolYear(historicalSchoolyear.id));

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
          const schoolyears = yield* client.schoolyears.list;
          const historicalSchoolyear = requireHistoricalSchoolyear(schoolyears);
          const { externalCalendar, roomId, timegrid, weekOverview } = yield* Effect.gen(
            function* () {
              const roomFilter = yield* client.timetable.getFilter({
                ...historicalDataWindow,
                resourceType: "ROOM",
                timetableType: "OVERVIEW_WEEK",
              });
              const roomId = (
                roomFilter.rooms.find((room) => room.room.shortName === "1.12") ??
                roomFilter.rooms[0]
              )?.room.id;
              if (roomId === undefined) {
                throw new Error("Expected at least one room");
              }
              const timegrid = yield* client.timetable.getTimeGrid;
              const weekOverview = yield* client.timetable.getEntriesWeekOverview({
                ...historicalDataWindow,
                resourceType: "ROOM",
                resources: [roomId],
              });
              const externalCalendar = yield* client.timetable.getExternalCalendar({
                myTimetable: true,
              });
              return { externalCalendar, roomId, timegrid, weekOverview };
            },
          ).pipe(client.withSchoolYear(historicalSchoolyear.id));

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
          const schoolyears = yield* client.schoolyears.list;
          const historicalSchoolyear = requireHistoricalSchoolyear(schoolyears);
          const roomFilter = yield* client.timetable
            .getFilter({
              start: historicalDataWindow.start,
              end: historicalDataWindow.start,
              resourceType: "ROOM",
            })
            .pipe(client.withSchoolYear(historicalSchoolyear.id));
          const teacherFilter = yield* client.timetable
            .getFilter({
              start: historicalDataWindow.start,
              end: historicalDataWindow.start,
              resourceType: "TEACHER",
            })
            .pipe(client.withSchoolYear(historicalSchoolyear.id));
          const subjectFilter = yield* client.timetable
            .getFilter({
              start: historicalDataWindow.start,
              end: historicalDataWindow.start,
              resourceType: "SUBJECT",
            })
            .pipe(client.withSchoolYear(historicalSchoolyear.id));
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
      "reads non-empty timetable entries using historical classes",
      () =>
        Effect.gen(function* () {
          const client = yield* WebUntisClient;
          const schoolyears = yield* client.schoolyears.list;
          const historicalSchoolyear = requireHistoricalSchoolyear(schoolyears);
          const { entries, filter, grid, settings } = yield* Effect.gen(function* () {
            const filter = yield* client.timetable.getFilter({
              ...historicalDataWindow,
              resourceType: "CLASS",
            });
            const [firstClassId, ...remainingClassIds] = filter.classes
              .slice(0, 12)
              .map((item) => item.class.id);
            if (firstClassId === undefined) {
              throw new Error("Expected at least one historical class");
            }
            const classIds: [number, ...Array<number>] = [firstClassId, ...remainingClassIds];
            const grid = yield* client.timetable.getGrid();
            const settings = yield* client.timetable.getEntriesSettings({
              resourceType: "CLASS",
            });
            const entries = yield* client.timetable.getEntries({
              ...historicalDataWindow,
              resourceType: "CLASS",
              resources: classIds,
            });
            return { entries, filter, grid, settings };
          }).pipe(client.withSchoolYear(historicalSchoolyear.id));

          if (filter.classes.length === 0) {
            throw new Error("Expected at least one class");
          }

          expect(filter.classes.length).toBeGreaterThan(0);
          expect(timetableEntryCount([entries])).toBeGreaterThan(0);
          expect(normalizeTimetableGrid(grid)).toMatchSnapshot();
          expect(normalizeTimetableFilter(filter)).toMatchSnapshot();
          expect(normalizeTimetableEntriesSettings(settings)).toMatchSnapshot();
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
