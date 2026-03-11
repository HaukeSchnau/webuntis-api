import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import { SessionStatusSchema } from "./schemas.ts";

export interface SessionStatusRequest {
  readonly clientTimeZone?: string | undefined;
}

export const makeSessionClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getStatus: (request: SessionStatusRequest = {}) =>
      http.postSchema("api/rest/view/v1/session/status", SessionStatusSchema, {
        body: request,
        withSchoolYearHeader: false
      })
  };
});
