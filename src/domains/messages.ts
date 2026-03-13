import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import {
  MessageDetailSchema,
  MessageDraftsSchema,
  MessageRecipientQuickfiltersSchema,
  MessageSentSchema,
  MessagesInboxSchema,
  MessagesPermissionsSchema,
  MessagesStatusSchema
} from "./schemas.ts";

export const makeMessagesClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getInbox: http.getSchema("api/rest/view/v1/messages", MessagesInboxSchema, {
      withSchoolYearHeader: false
    }),
    getDrafts: http.getSchema("api/rest/view/v1/messages/drafts", MessageDraftsSchema, {
      withSchoolYearHeader: false
    }),
    getPermissions: http.getSchema("api/rest/view/v1/messages/permissions", MessagesPermissionsSchema),
    getRecipientQuickfilters: http.getSchema(
      "api/rest/view/v1/messages/recipients/quickfilters",
      MessageRecipientQuickfiltersSchema,
      { withSchoolYearHeader: false }
    ),
    getSent: http.getSchema("api/rest/view/v1/messages/sent", MessageSentSchema, {
      withSchoolYearHeader: false
    }),
    getStatus: http.getSchema("api/rest/view/v1/messages/status", MessagesStatusSchema),
    getMessage: (id: number) =>
      http.getSchema(`api/rest/view/v1/messages/${id}`, MessageDetailSchema, {
        withSchoolYearHeader: false
      })
  };
});
