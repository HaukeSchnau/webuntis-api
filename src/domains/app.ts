import { Effect } from "effect";
import { SessionStore } from "../core/session-store.ts";
import { WebUntisHttp } from "../core/http.ts";
import { AppDataSchema } from "./schemas.ts";

export interface AppClient {
  readonly getData: Effect.Effect<any, unknown>;
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
    getData
  };
});
