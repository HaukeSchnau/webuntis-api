import { RequestPolicy, schemaRequest } from "../../internal/request.ts";
import {
  MessageComposeRecipientsSchema,
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

export interface MessageRecipientFilterRequest {
  readonly recipientOption: MessageRecipientOption;
}

export interface MessageComposeRecipientsRequest {
  readonly recipientOption: MessageRecipientOption;
  readonly filters?: ReadonlyArray<unknown> | undefined;
  readonly searchText?: string | undefined;
}

export interface MessageReplyFormRequest {
  readonly id: number;
}

export interface MessageDetailRequest {
  readonly id: number;
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
    MessageRecipientFilterRequest,
    typeof MessageRecipientFilterSchema
  >({
    method: "GET",
    path: (request) =>
      `api/rest/view/v1/messages/recipients/${encodeURIComponent(request.recipientOption)}/filter`,
    policy: RequestPolicy.AuthOnly,
    schema: MessageRecipientFilterSchema,
  }),
  filterComposeRecipients: schemaRequest<
    MessageComposeRecipientsRequest,
    typeof MessageComposeRecipientsSchema
  >({
    method: "POST",
    path: (request) =>
      `api/rest/view/v2/messages/recipients/${encodeURIComponent(request.recipientOption)}/filter`,
    body: (request) => ({
      filters: request.filters ?? [],
      searchText: request.searchText ?? "",
    }),
    policy: RequestPolicy.AuthOnly,
    schema: MessageComposeRecipientsSchema,
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
  getReplyForm: schemaRequest<
    MessageReplyFormRequest,
    typeof MessageReplyFormSchema
  >({
    method: "GET",
    path: (request) => `api/rest/view/v1/messages/${request.id}/reply-form`,
    policy: RequestPolicy.AuthOnly,
    schema: MessageReplyFormSchema,
  }),
  getMessage: schemaRequest<MessageDetailRequest, typeof MessageDetailSchema>({
    method: "GET",
    path: (request) => `api/rest/view/v1/messages/${request.id}`,
    policy: RequestPolicy.AuthOnly,
    schema: MessageDetailSchema,
  }),
} as const;
