import { Schema } from "effect";
import { NonBlankString, RequestPolicy, schemaRequest } from "../../internal/request.ts";
import { SessionStatusSchema } from "./schema.ts";

const SessionStatusInput = Schema.Struct({ clientTimeZone: Schema.optional(NonBlankString) });

export type SessionStatusRequest = typeof SessionStatusInput.Type;

export const SessionRequests = {
  getStatus: schemaRequest<SessionStatusRequest, typeof SessionStatusSchema>({
    method: "POST",
    path: "api/rest/view/v1/session/status",
    body: (request) => request,
    policy: RequestPolicy.AuthOnly,
    inputSchema: SessionStatusInput,
    schema: SessionStatusSchema,
  }),
} as const;
