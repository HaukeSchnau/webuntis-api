import { Effect, Schema } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import { SchoolyearSchema } from "./schemas.ts";

export const makeSchoolyearsClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    list: http.getSchema("api/rest/view/v1/schoolyears", Schema.Array(SchoolyearSchema), {
      withSchoolYearHeader: false
    })
  };
});
