import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import {
  MessageDetailSchema,
  MessageDraftsSchema,
  MessageRecipientFilterSchema,
  type MessageRecipientOption,
  MessageRecipientQuickfiltersSchema,
  MessageReplyFormSchema,
  MessageRecipientSearchSchema,
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
    getRecipientFilter: (recipientOption: MessageRecipientOption) =>
      http.getSchema(
        `api/rest/view/v1/messages/recipients/${encodeURIComponent(recipientOption)}/filter`,
        MessageRecipientFilterSchema,
        { withSchoolYearHeader: false }
      ),
    searchRecipients: (recipientOption: MessageRecipientOption, searchText: string) =>
      http.getSchema(
        `api/rest/view/v1/messages/recipients/${encodeURIComponent(recipientOption)}/search`,
        MessageRecipientSearchSchema,
        {
          query: { searchText },
          withSchoolYearHeader: false
        }
      ),
    getSent: http.getSchema("api/rest/view/v1/messages/sent", MessageSentSchema, {
      withSchoolYearHeader: false
    }),
    getStatus: http.getSchema("api/rest/view/v1/messages/status", MessagesStatusSchema),
    getReplyForm: (id: number) =>
      http.getSchema(`api/rest/view/v1/messages/${id}/reply-form`, MessageReplyFormSchema, {
        withSchoolYearHeader: false
      }),
    getMessage: (id: number) =>
      http.getSchema(`api/rest/view/v1/messages/${id}`, MessageDetailSchema, {
        withSchoolYearHeader: false
      })
  };
});
