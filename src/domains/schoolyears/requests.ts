import { Schema } from "effect";
import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import { SchoolyearSchema } from "../shared/schema.ts";

const SchoolyearsSchema = Schema.Array(SchoolyearSchema);

export const SchoolyearsRequests = {
  list: schemaRequest<void, typeof SchoolyearsSchema>({
    method: "GET",
    path: "api/rest/view/v1/schoolyears",
    policy: RequestPolicy.AuthOnly,
    schema: SchoolyearsSchema,
  }),
} as const;
