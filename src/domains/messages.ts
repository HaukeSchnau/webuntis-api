import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import { MessagesPermissionsSchema, MessagesStatusSchema } from "./schemas.ts";

export const makeMessagesClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getPermissions: http.getSchema("api/rest/view/v1/messages/permissions", MessagesPermissionsSchema),
    getStatus: http.getSchema("api/rest/view/v1/messages/status", MessagesStatusSchema)
  };
});
