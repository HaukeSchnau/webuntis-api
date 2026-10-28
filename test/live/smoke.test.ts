import { describe, expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { AuthClient } from "../../src/auth.ts";
import { WebUntisClient, webUntisLayer } from "../../src/client.ts";
import { WebUntisConnection } from "../../src/internal/connection.ts";
import {
  liveEnvMissing,
  normalizeAppData,
  normalizeHome,
  normalizeMobileData,
  normalizeStartupActions,
} from "./support.ts";

const hasLiveEnv = liveEnvMissing.length === 0;

const liveLayer = Layer.unwrap(WebUntisConnection.fromEnv.pipe(Effect.map(webUntisLayer))).pipe(
  Layer.provide(FetchHttpClient.layer),
);

describe.skipIf(!hasLiveEnv)("live WebUntis smoke", () => {
  layer(liveLayer, { excludeTestServices: true })("with live layer", (it) => {
    it.effect(
      "bootstraps auth and reads app metadata",
      () =>
        Effect.gen(function* () {
          const auth = yield* AuthClient;
          const client = yield* WebUntisClient;
          yield* auth.ensureAuthenticated;

          const appData = yield* client.app.getData;
          expect(appData.tenant.id.length).toBeGreaterThan(0);
          expect(appData.currentSchoolYear === null || appData.currentSchoolYear.id > 0).toBe(true);
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
          expect(mobileData.schoolYear === null || mobileData.schoolYear.id > 0).toBe(true);
          expect(Array.isArray(startupActions.startupActions)).toBe(true);
          expect(normalizeHome(home)).toMatchSnapshot();
          expect(normalizeMobileData(mobileData)).toMatchSnapshot();
          expect(normalizeStartupActions(startupActions)).toMatchSnapshot();
        }),
      30_000,
    );
  });
});
