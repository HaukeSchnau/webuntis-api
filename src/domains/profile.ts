import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import { UserContactDataSchema, UserEmailSchema } from "./schemas.ts";

export interface ExperimentalAdminDetailsUpdateRequest {
  readonly systemEmail: string;
  readonly username: string;
  readonly password: string;
  readonly email: string;
}

export const makeProfileClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getUserContactData: http.getSchema("api/rest/view/v1/profile/user-contact-data", UserContactDataSchema),
    getUserEmail: http.getSchema("api/rest/view/v1/profile/user-email", UserEmailSchema),
    experimental: {
      getProfileJson: http.getJson("api/rest/view/v1/profile", {
        withSchoolYearHeader: false
      }),
      getAdminDetailsJson: http.getJson("api/rest/view/v1/profile/admin/details", {
        withSchoolYearHeader: false
      }),
      delayVerification: http.post("api/rest/view/v1/profile/verification/delay", {
        withSchoolYearHeader: false
      }).pipe(Effect.asVoid),
      requestPasswordResetInfo: http.post("api/rest/view/v1/profile/password/reset", {
        withSchoolYearHeader: false
      }).pipe(Effect.asVoid),
      updateAdminDetails: (request: ExperimentalAdminDetailsUpdateRequest) =>
        http.put("api/rest/view/v1/profile/admin/details", {
          body: request,
          withSchoolYearHeader: false
        }).pipe(Effect.asVoid)
    }
  };
});
