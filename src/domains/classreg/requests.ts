import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import {
  ClassregAbsencesMetaSchema,
  ClassregHomeworkMetaSchema,
} from "../schemas/classreg.ts";

export const ClassregRequests = {
  getAbsencesMeta: schemaRequest<void, typeof ClassregAbsencesMetaSchema>({
    method: "GET",
    path: "api/rest/view/v1/classreg/absences/meta",
    policy: RequestPolicy.AuthOnly,
    schema: ClassregAbsencesMetaSchema,
  }),
  getHomeworkMeta: schemaRequest<void, typeof ClassregHomeworkMetaSchema>({
    method: "GET",
    path: "api/rest/view/v1/classreg/homework/meta",
    policy: RequestPolicy.AuthOnly,
    schema: ClassregHomeworkMetaSchema,
  }),
} as const;
