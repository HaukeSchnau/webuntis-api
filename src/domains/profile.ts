import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import { UserContactDataSchema, UserEmailSchema } from "./schemas.ts";

export const makeProfileClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getUserContactData: http.getSchema("api/rest/view/v1/profile/user-contact-data", UserContactDataSchema),
    getUserEmail: http.getSchema("api/rest/view/v1/profile/user-email", UserEmailSchema)
  };
});
