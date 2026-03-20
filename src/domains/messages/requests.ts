import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import {
  MessageDetailSchema,
  MessageDraftsSchema,
  MessageRecipientFilterSchema,
  type MessageRecipientOption,
  MessageRecipientQuickfiltersSchema,
  MessageRecipientSearchSchema,
  MessageReplyFormSchema,
  MessageSentSchema,
  MessagesInboxSchema,
  MessagesPermissionsSchema,
  MessagesStatusSchema,
} from "./schema.ts";

export interface MessageRecipientSearchRequest {
  readonly recipientOption: MessageRecipientOption;
  readonly searchText: string;
}

export const MessagesRequests = {
  getInbox: schemaRequest<void, typeof MessagesInboxSchema>({
    method: "GET",
    path: "api/rest/view/v1/messages",
    policy: RequestPolicy.AuthOnly,
    schema: MessagesInboxSchema,
  }),
  getDrafts: schemaRequest<void, typeof MessageDraftsSchema>({
    method: "GET",
    path: "api/rest/view/v1/messages/drafts",
    policy: RequestPolicy.AuthOnly,
    schema: MessageDraftsSchema,
  }),
  getPermissions: schemaRequest<void, typeof MessagesPermissionsSchema>({
    method: "GET",
    path: "api/rest/view/v1/messages/permissions",
    policy: RequestPolicy.Metadata,
    schema: MessagesPermissionsSchema,
  }),
  getRecipientQuickfilters: schemaRequest<
    void,
    typeof MessageRecipientQuickfiltersSchema
  >({
    method: "GET",
    path: "api/rest/view/v1/messages/recipients/quickfilters",
    policy: RequestPolicy.AuthOnly,
    schema: MessageRecipientQuickfiltersSchema,
  }),
  getRecipientFilter: schemaRequest<
    MessageRecipientOption,
    typeof MessageRecipientFilterSchema
  >({
    method: "GET",
    path: (recipientOption) =>
      `api/rest/view/v1/messages/recipients/${encodeURIComponent(recipientOption)}/filter`,
    policy: RequestPolicy.AuthOnly,
    schema: MessageRecipientFilterSchema,
  }),
  searchRecipients: schemaRequest<
    MessageRecipientSearchRequest,
    typeof MessageRecipientSearchSchema
  >({
    method: "GET",
    path: (request) =>
      `api/rest/view/v1/messages/recipients/${encodeURIComponent(request.recipientOption)}/search`,
    query: (request) => ({ searchText: request.searchText }),
    policy: RequestPolicy.AuthOnly,
    schema: MessageRecipientSearchSchema,
  }),
  getSent: schemaRequest<void, typeof MessageSentSchema>({
    method: "GET",
    path: "api/rest/view/v1/messages/sent",
    policy: RequestPolicy.AuthOnly,
    schema: MessageSentSchema,
  }),
  getStatus: schemaRequest<void, typeof MessagesStatusSchema>({
    method: "GET",
    path: "api/rest/view/v1/messages/status",
    policy: RequestPolicy.Metadata,
    schema: MessagesStatusSchema,
  }),
  getReplyForm: schemaRequest<number, typeof MessageReplyFormSchema>({
    method: "GET",
    path: (id) => `api/rest/view/v1/messages/${id}/reply-form`,
    policy: RequestPolicy.AuthOnly,
    schema: MessageReplyFormSchema,
  }),
  getMessage: schemaRequest<number, typeof MessageDetailSchema>({
    method: "GET",
    path: (id) => `api/rest/view/v1/messages/${id}`,
    policy: RequestPolicy.AuthOnly,
    schema: MessageDetailSchema,
  }),
} as const;
