import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import { SessionStatusSchema } from "../schemas/session.ts";

export interface SessionStatusRequest {
  readonly clientTimeZone?: string | undefined;
}

export const SessionRequests = {
  getStatus: schemaRequest<SessionStatusRequest, typeof SessionStatusSchema>({
    method: "POST",
    path: "api/rest/view/v1/session/status",
    body: (request) => request,
    policy: RequestPolicy.AuthOnly,
    schema: SessionStatusSchema,
  }),
} as const;
