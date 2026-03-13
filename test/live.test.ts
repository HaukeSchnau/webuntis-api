import { describe, expect, it, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { AuthClient } from "../src/core/auth.ts";
import { fromEnv } from "../src/core/config.ts";
import { UnexpectedResponseError } from "../src/core/errors.ts";
import { layer as makeWebUntisLayer, WebUntisClient } from "../src/client.ts";
import {
  liveEnvMissing,
  normalizeAppData,
  normalizeHome,
  normalizeMessagesPermissions,
  normalizeMessagesStatus,
  normalizeMobileData,
  normalizeSessionStatus,
  normalizeStartupActions,
  normalizeTimetableCalendar,
  normalizeTimetableEntries,
  normalizeTimetableEntriesSettings,
  normalizeTimetableFilter,
  normalizeTimetableGrid,
  normalizeTimetableMenu,
  normalizeTimetableSearch,
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

    it.effect("reads schoolyears and message metadata", () =>
      Effect.gen(function*() {
        const client = yield* WebUntisClient;
        const schoolyears = yield* client.schoolyears.list;
        const messagePermissions = yield* client.messages.getPermissions;
        const messageStatus = yield* client.messages.getStatus;

        expect(schoolyears.length).toBeGreaterThan(0);
        expect(normalizeMessagesPermissions(messagePermissions)).toMatchSnapshot();
        expect(normalizeMessagesStatus(messageStatus)).toMatchSnapshot();
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

        expect(status.expiresInMs).toBeGreaterThanOrEqual(0);
        expect(search.results.length).toBeGreaterThan(0);
        expect(normalizeSessionStatus(status)).toMatchSnapshot();
        expect(normalizeTimetableMenu(menu)).toMatchSnapshot();
        expect(normalizeTimetableSearch(search)).toMatchSnapshot();
        expect(normalizeTimetableCalendar(calendar)).toMatchSnapshot();
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
