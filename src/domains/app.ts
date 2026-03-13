import { Effect } from "effect";
import { SessionStore } from "../core/session-store.ts";
import { WebUntisHttp } from "../core/http.ts";
import {
  AppDataSchema,
  type AppData,
  HomeSchema,
  type Home,
  MobileDataSchema,
  type MobileData,
  StartupActionsSchema,
  type StartupActions
} from "./schemas.ts";

export interface AppClient {
  readonly getData: Effect.Effect<AppData, unknown>;
  readonly getHome: Effect.Effect<Home, unknown>;
  readonly getMobileData: Effect.Effect<MobileData, unknown>;
  readonly getStartupActions: Effect.Effect<StartupActions, unknown>;
}

export const makeAppClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;
  const sessionStore = yield* SessionStore;

  const getData = http.getSchema("api/rest/view/v1/app/data", AppDataSchema, {
    withSchoolYearHeader: false
  }).pipe(
    Effect.tap((appData) =>
      sessionStore.update((state) => ({
        ...state,
        tenantId: state.tenantId ?? appData.tenant.id,
        schoolYearId: appData.currentSchoolYear.id
      }))
    )
  );

  return {
    getData,
    getHome: http.getSchema("api/rest/view/v1/home", HomeSchema, {
      withSchoolYearHeader: false
    }),
    getMobileData: http.getSchema("api/rest/view/v1/mobile/data", MobileDataSchema, {
      withSchoolYearHeader: false
    }),
    getStartupActions: http.getSchema("api/rest/view/v1/trigger/startup", StartupActionsSchema, {
      withSchoolYearHeader: false
    })
  };
});
