import { describe, expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { AuthClient } from "../../src/auth.ts";
import {
  layer as makeWebUntisLayer,
  WebUntisClient,
} from "../../src/client.ts";
import { ClientConfig } from "../../src/internal/config.ts";
import {
  liveEnvMissing,
  normalizeAppData,
  normalizeHome,
  normalizeMobileData,
  normalizeStartupActions,
} from "./support.ts";

const hasLiveEnv = liveEnvMissing.length === 0;

const liveLayer = Layer.unwrap(
  ClientConfig.fromEnv().pipe(Effect.map(makeWebUntisLayer)),
);

describe.skipIf(!hasLiveEnv)("live WebUntis smoke", () => {
  layer(liveLayer, { excludeTestServices: true })("with live layer", (it) => {
    it.effect(
      "bootstraps auth and reads app metadata",
      () =>
        Effect.gen(function* () {
          const auth = yield* AuthClient;
          const client = yield* WebUntisClient;
          const state = yield* auth.ensureAuthenticated;
          expect(state.resolvedSchool?.server).toContain(".webuntis.com");
          expect(state.token).toBeDefined();

          const appData = yield* client.app.getData;
          expect(appData.currentSchoolYear.id).toBeGreaterThan(0);
          expect(normalizeAppData(appData)).toMatchSnapshot();
        }),
      30_000,
    );

    it.effect(
      "reads bootstrap and home endpoints",
      () =>
        Effect.gen(function* () {
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
        }),
      30_000,
    );
  });
});
