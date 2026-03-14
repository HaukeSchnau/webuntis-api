import { describe, expect, it, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { AuthClient } from "../src/core/auth.ts";
import { fromEnv } from "../src/core/config.ts";
import { UnexpectedResponseError } from "../src/core/errors.ts";
import { layer as makeWebUntisLayer, WebUntisClient } from "../src/client.ts";
import {
  liveEnvMissing,
  normalizeAppData,
  normalizeAppPlatformApplicationMenus,
  normalizeAppThirdPartyData,
  normalizeDashboardCards,
  normalizeDashboardCardsDetail,
  normalizeDashboardCardsStatus,
  normalizeHome,
  normalizeMessageDetail,
  normalizeMessageDrafts,
  normalizeMessageRecipientFilter,
  normalizeMessageRecipientQuickfilters,
  normalizeMessageReplyForm,
  normalizeMessageRecipientSearch,
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
  normalizeTimetableEntriesWeekOverview,
  normalizeTimetableEntriesSettings,
  normalizeTimetableExternalCalendar,
  normalizeTimetableFilter,
  normalizeTimetableGrid,
  normalizeTimetableMenu,
  normalizeTimetableSearch,
  normalizeTodayMeta,
  normalizeUnexpectedResponse,
  normalizeUserContactData,
  normalizeUserEmail
} from "./support.ts";

const hasLiveEnv = liveEnvMissing.length === 0;

const liveLayer = Layer.unwrap(
  fromEnv().pipe(Effect.map(makeWebUntisLayer))
);

describe.skipIf(!hasLiveEnv)("live WebUntis integration", () => {
  layer(liveLayer, { excludeTestServices: true })("with live layer", (it) => {
    it.effect("bootstraps auth and reads app metadata", () =>
      Effect.gen(function*() {
        const auth = yield* AuthClient;
        const client = yield* WebUntisClient;
        const state = yield* auth.ensureAuthenticated;
        expect(state.resolvedSchool?.server).toContain(".webuntis.com");
        expect(state.token).toBeDefined();

        const appData = yield* client.app.getData;
        expect(appData.currentSchoolYear.id).toBeGreaterThan(0);
        expect(normalizeAppData(appData)).toMatchSnapshot();
      }), 30_000);

    it.effect("reads bootstrap and home endpoints", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const home = yield* client.app.getHome;
        const mobileData = yield* client.app.getMobileData;
        const startupActions = yield* client.app.getStartupActions;

        expect(home.schoolName).toContain("IGS");
        expect(mobileData.schoolYear.id).toBeGreaterThan(0);
        expect(Array.isArray(startupActions.startupActions)).toBe(true);
        expect(normalizeHome(home)).toMatchSnapshot();
        expect(normalizeMobileData(mobileData)).toMatchSnapshot();
        expect(normalizeStartupActions(startupActions)).toMatchSnapshot();
      }), 30_000);

    it.effect("reads additional app bootstrap endpoints", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const todayMeta = yield* client.app.getTodayMeta;
        const dashboardCards = yield* client.app.getDashboardCards;
        const dashboardCardsDetail = yield* client.app.getDashboardCardsDetail;
        const dashboardCardsStatus = yield* client.app.getDashboardCardsStatus;
        const menus = yield* client.app.getPlatformApplicationMenus;
        const thirdPartyData = yield* client.app.getThirdPartyData;
        const onboarding = yield* client.app.getOnboarding({ type: "TIMETABLE" });

        expect(todayMeta.greetingName.length).toBeGreaterThan(0);
        expect(Array.isArray(dashboardCards.dashboardCards)).toBe(true);
        expect(Array.isArray(dashboardCardsDetail.dashboardCardsDetails)).toBe(true);
        expect(dashboardCardsStatus.unreadCardsCount).toBeGreaterThanOrEqual(0);
        expect(menus.length).toBeGreaterThan(0);
        expect(thirdPartyData).toHaveProperty("sleekplanToken");
        expect(onboarding.type).toBe("TIMETABLE");
        expect(normalizeTodayMeta(todayMeta)).toMatchSnapshot();
        expect(normalizeDashboardCards(dashboardCards)).toMatchSnapshot();
        expect(normalizeDashboardCardsDetail(dashboardCardsDetail)).toMatchSnapshot();
        expect(normalizeDashboardCardsStatus(dashboardCardsStatus)).toMatchSnapshot();
        expect(normalizeAppPlatformApplicationMenus(menus)).toMatchSnapshot();
        expect(normalizeAppThirdPartyData(thirdPartyData)).toMatchSnapshot();
        expect(normalizeOnboarding(onboarding)).toMatchSnapshot();
      }), 30_000);

    it.effect("reads schoolyears and message endpoints", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const schoolyears = yield* client.schoolyears.list;
        const inbox = yield* client.messages.getInbox;
        const drafts = yield* client.messages.getDrafts;
        const messagePermissions = yield* client.messages.getPermissions;
        const quickfilters = yield* client.messages.getRecipientQuickfilters;
        const staffFilter = yield* client.messages.getRecipientFilter("STAFF");
        const staffSearch = yield* client.messages.searchRecipients("STAFF", "a");
        const sent = yield* client.messages.getSent;
        const messageStatus = yield* client.messages.getStatus;
        const messageId = inbox.incomingMessages[0]?.id;

        expect(schoolyears.length).toBeGreaterThan(0);
        expect(messageId).toBeDefined();
        expect(staffFilter.filters.length).toBeGreaterThan(0);
        const detail = yield* client.messages.getMessage(messageId!);
        const replyForm = yield* client.messages.getReplyForm(messageId!);

        expect(normalizeMessagesInbox(inbox)).toMatchSnapshot();
        expect(normalizeMessageDrafts(drafts)).toMatchSnapshot();
        expect(normalizeMessagesPermissions(messagePermissions)).toMatchSnapshot();
        expect(normalizeMessageRecipientQuickfilters(quickfilters)).toMatchSnapshot();
        expect(normalizeMessageRecipientFilter(staffFilter)).toMatchSnapshot();
        expect(normalizeMessageRecipientSearch(staffSearch)).toMatchSnapshot();
        expect(normalizeMessageSent(sent)).toMatchSnapshot();
        expect(normalizeMessagesStatus(messageStatus)).toMatchSnapshot();
        expect(normalizeMessageDetail(detail)).toMatchSnapshot();
        expect(normalizeMessageReplyForm(replyForm)).toMatchSnapshot();
      }), 30_000);

    it.effect("reads user contact endpoints", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const contactData = yield* client.profile.getUserContactData;
        const email = yield* client.profile.getUserEmail;

        expect(contactData).toHaveProperty("email");
        expect(email.email).toContain("@");
        expect(normalizeUserContactData(contactData)).toMatchSnapshot();
        expect(normalizeUserEmail(email)).toMatchSnapshot();
      }), 30_000);

    it.effect("documents current upstream profile summary/admin failures", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const profileError = yield* Effect.flip(client.profile.experimental.getProfileJson);
        const adminDetailsError = yield* Effect.flip(client.profile.experimental.getAdminDetailsJson);

        expect(profileError).toBeInstanceOf(UnexpectedResponseError);
        expect(adminDetailsError).toBeInstanceOf(UnexpectedResponseError);
        expect(normalizeUnexpectedResponse(profileError as UnexpectedResponseError)).toMatchSnapshot();
        expect(normalizeUnexpectedResponse(adminDetailsError as UnexpectedResponseError)).toMatchSnapshot();
      }), 30_000);

    it.effect("reads session status and timetable discovery endpoints", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const appData = yield* client.app.getData;
        const status = yield* client.session.getStatus();
        const menu = yield* client.timetable.getMenu;
        const calendar = yield* client.timetable.getCalendar();
        const search = yield* client.timetable.search({
          query: "10",
          schoolyear: appData.currentSchoolYear.id
        });
        const availableRooms = yield* client.timetable.getAvailableRooms({
          startDateTime: "2026-03-13T08:00:00",
          endDateTime: "2026-03-13T10:00:00"
        });

        expect(status.expiresInMs).toBeGreaterThanOrEqual(0);
        expect(search.results.length).toBeGreaterThan(0);
        expect(availableRooms.length).toBeGreaterThan(0);
        expect(normalizeSessionStatus(status)).toMatchSnapshot();
        expect(normalizeTimetableMenu(menu)).toMatchSnapshot();
        expect(normalizeTimetableSearch(search)).toMatchSnapshot();
        expect(normalizeTimetableCalendar(calendar)).toMatchSnapshot();
        expect(normalizeTimetableAvailableRooms(availableRooms)).toMatchSnapshot();
      }), 30_000);

    it.effect("reads additional timetable overview endpoints", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const roomFilter = yield* client.timetable.getFilter({
          start: "2026-03-16",
          end: "2026-03-20",
          resourceType: "ROOM",
          timetableType: "OVERVIEW_WEEK"
        });
        const roomId = (roomFilter.rooms.find((room) => room.room.shortName === "1.12") ?? roomFilter.rooms[0])?.room.id;
        const timegrid = yield* client.timetable.getTimeGrid;
        const weekOverview = yield* client.timetable.getEntriesWeekOverview({
          start: "2026-03-16",
          end: "2026-03-20",
          resourceType: "ROOM",
          resources: [roomId!]
        });
        const externalCalendar = yield* client.timetable.getExternalCalendar;

        expect(roomId).toBeDefined();
        expect(timegrid.units.length).toBeGreaterThan(0);
        expect(weekOverview.slots.length).toBeGreaterThan(0);
        expect(weekOverview.days.length).toBeGreaterThan(0);
        expect(Array.isArray(externalCalendar)).toBe(true);
        expect(normalizeTimeGrid(timegrid)).toMatchSnapshot();
        expect(normalizeTimetableEntriesWeekOverview(weekOverview)).toMatchSnapshot();
        expect(normalizeTimetableExternalCalendar(externalCalendar)).toMatchSnapshot();
      }), 30_000);

    it.effect("documents current timetable utility/settings access behavior", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const formatListError = yield* Effect.flip(client.timetable.experimental.getFormatListJson);
        const generalSettingsError = yield* Effect.flip(client.timetable.experimental.getGeneralSettingsJson);
        const visibilityRestrictionError = yield* Effect.flip(
          client.timetable.experimental.getVisibilityRestrictionJson
        );

        expect(formatListError).toBeInstanceOf(UnexpectedResponseError);
        expect(generalSettingsError).toBeInstanceOf(UnexpectedResponseError);
        expect(visibilityRestrictionError).toBeInstanceOf(UnexpectedResponseError);
        expect(normalizeUnexpectedResponse(formatListError as UnexpectedResponseError)).toMatchSnapshot();
        expect(normalizeUnexpectedResponse(generalSettingsError as UnexpectedResponseError)).toMatchSnapshot();
        expect(normalizeUnexpectedResponse(visibilityRestrictionError as UnexpectedResponseError)).toMatchSnapshot();
      }), 30_000);

    it.effect("documents current blocked or unstable read-only endpoints", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const roomFilter = yield* client.timetable.getFilter({
          start: "2026-03-16",
          end: "2026-03-16",
          resourceType: "ROOM"
        });
        const teacherFilter = yield* client.timetable.getFilter({
          start: "2026-03-16",
          end: "2026-03-16",
          resourceType: "TEACHER"
        });
        const subjectFilter = yield* client.timetable.getFilter({
          start: "2026-03-16",
          end: "2026-03-16",
          resourceType: "SUBJECT"
        });
        const roomId = (roomFilter.rooms.find((room) => room.room.shortName === "1.12") ?? roomFilter.rooms[0])?.room.id;
        const teacherId = teacherFilter.teachers[0]?.teacher.id;
        const subjectId = subjectFilter.subjects[0]?.subject.id;
        expect(roomId).toBeDefined();
        expect(teacherId).toBeDefined();
        expect(subjectId).toBeDefined();
        const messagesOfTheDayError = yield* Effect.flip(
          client.rawViewApi.getJson("api/rest/view/v1/messages-of-the-day", {
            withSchoolYearHeader: false
          })
        );
        const staticTeachersError = yield* Effect.flip(
          client.rawViewApi.getJson("api/rest/view/v1/messages/recipients/static/teachers", {
            withSchoolYearHeader: false
          })
        );
        const staticUsersError = yield* Effect.flip(
          client.rawViewApi.getJson("api/rest/view/v1/messages/recipients/static/users", {
            withSchoolYearHeader: false
          })
        );
        const staticPersonsError = yield* Effect.flip(
          client.rawViewApi.getJson("api/rest/view/v1/messages/recipients/static/persons", {
            withSchoolYearHeader: false
          })
        );
        const roomsError = yield* Effect.flip(client.rawViewApi.getJson("api/rest/view/v1/rooms"));
        const roomDetailError = yield* Effect.flip(client.rawViewApi.getJson(`api/rest/view/v1/rooms/${roomId}`));
        const buildingsError = yield* Effect.flip(client.rawViewApi.getJson("api/rest/view/v1/buildings"));
        const teachersError = yield* Effect.flip(client.rawViewApi.getJson("api/rest/view/v1/teachers"));
        const teacherDetailError = yield* Effect.flip(client.rawViewApi.getJson(`api/rest/view/v1/teachers/${teacherId}`));
        const subjectsError = yield* Effect.flip(client.rawViewApi.getJson("api/rest/view/v1/subjects"));
        const subjectDetailError = yield* Effect.flip(client.rawViewApi.getJson(`api/rest/view/v1/subjects/${subjectId}`));

        for (const error of [
          messagesOfTheDayError,
          staticTeachersError,
          staticUsersError,
          staticPersonsError,
          roomsError,
          roomDetailError,
          buildingsError,
          teachersError,
          teacherDetailError,
          subjectsError,
          subjectDetailError
        ]) {
          expect(error).toBeInstanceOf(UnexpectedResponseError);
          expect(normalizeUnexpectedResponse(error as UnexpectedResponseError)).toMatchSnapshot();
        }
      }), 30_000);

    it.effect("reads timetable endpoints using the first discovered class", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const appData = yield* client.app.getData;
        const start = new Date().toISOString().slice(0, 10);
        const end = start;
        const filter = yield* client.timetable.getFilter({
          start,
          end,
          resourceType: "CLASS"
        });
        const classId = filter.classes[0]?.class.id;
        expect(classId).toBeDefined();

        const grid = yield* client.timetable.getGrid();
        const settings = yield* client.timetable.getEntriesSettings({
          resourceType: "CLASS"
        });
        const entries = yield* client.timetable.getEntries({
          start,
          end,
          resourceType: "CLASS",
          resources: [classId!]
        });

        expect(appData.currentSchoolYear.id).toBeGreaterThan(0);
        expect(normalizeTimetableGrid(grid)).toMatchSnapshot();
        expect(normalizeTimetableFilter(filter)).toMatchSnapshot();
        expect(normalizeTimetableEntriesSettings(settings)).toMatchSnapshot();
        expect(normalizeTimetableEntries(entries)).toMatchSnapshot();
      }), 30_000);
  });
});

describe.skipIf(hasLiveEnv)("live WebUntis integration", () => {
  it("documents the required environment variables", () => {
    expect(liveEnvMissing).toEqual(expect.arrayContaining(["WEBUNTIS_SCHOOL_NAME", "WEBUNTIS_USERNAME", "WEBUNTIS_PASSWORD"]));
  });
});
