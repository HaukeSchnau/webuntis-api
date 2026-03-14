import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import {
  ClassregAbsencesMetaSchema,
  ClassregHomeworkMetaSchema
} from "./schemas.ts";

export const makeClassregClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getAbsencesMeta: http.getSchema("api/rest/view/v1/classreg/absences/meta", ClassregAbsencesMetaSchema, {
      withSchoolYearHeader: false
    }),
    getHomeworkMeta: http.getSchema("api/rest/view/v1/classreg/homework/meta", ClassregHomeworkMetaSchema, {
      withSchoolYearHeader: false
    })
  };
});
