import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import { UserContactDataSchema, UserEmailSchema } from "./schema.ts";

export const ProfileRequests = {
  getUserContactData: schemaRequest<void, typeof UserContactDataSchema>({
    method: "GET",
    path: "api/rest/view/v1/profile/user-contact-data",
    policy: RequestPolicy.Metadata,
    schema: UserContactDataSchema,
  }),
  getUserEmail: schemaRequest<void, typeof UserEmailSchema>({
    method: "GET",
    path: "api/rest/view/v1/profile/user-email",
    policy: RequestPolicy.Metadata,
    schema: UserEmailSchema,
  }),
} as const;
