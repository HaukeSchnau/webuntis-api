import { Context, Effect, Layer } from "effect";
import { makeOperations } from "../../internal/domain.ts";
import type { WebUntisError } from "../../internal/errors.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import {
  type MessageComposeRecipientsRequest,
  type MessageDetailRequest,
  type MessageRecipientFilterRequest,
  type MessageRecipientSearchRequest,
  type MessageReplyFormRequest,
  MessagesRequests,
} from "./requests.ts";
import type {
  MessageComposeRecipients,
  MessageDetail,
  MessageDrafts,
  MessageRecipientFilter,
  MessageRecipientQuickfilters,
  MessageRecipientSearch,
  MessageReplyForm,
  MessageSent,
  MessagesInbox,
  MessagesPermissions,
  MessagesStatus,
} from "./schema.ts";

export interface MessagesClientShape {
  readonly getInbox: Effect.Effect<MessagesInbox, WebUntisError>;
  readonly getDrafts: Effect.Effect<MessageDrafts, WebUntisError>;
  readonly getPermissions: Effect.Effect<MessagesPermissions, WebUntisError>;
  readonly getRecipientQuickfilters: Effect.Effect<MessageRecipientQuickfilters, WebUntisError>;
  readonly getRecipientFilter: (
    request: MessageRecipientFilterRequest,
  ) => Effect.Effect<MessageRecipientFilter, WebUntisError>;
  readonly filterComposeRecipients: (
    request: MessageComposeRecipientsRequest,
  ) => Effect.Effect<MessageComposeRecipients, WebUntisError>;
  readonly searchRecipients: (
    request: MessageRecipientSearchRequest,
  ) => Effect.Effect<MessageRecipientSearch, WebUntisError>;
  readonly getSent: Effect.Effect<MessageSent, WebUntisError>;
  readonly getStatus: Effect.Effect<MessagesStatus, WebUntisError>;
  readonly getReplyForm: (
    request: MessageReplyFormRequest,
  ) => Effect.Effect<MessageReplyForm, WebUntisError>;
  readonly getMessage: (
    request: MessageDetailRequest,
  ) => Effect.Effect<MessageDetail, WebUntisError>;
}

export class MessagesClient extends Context.Service<MessagesClient, MessagesClientShape>()(
  "webuntis/MessagesClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { read, call } = makeOperations(yield* WebUntisHttp, "MessagesClient");

      return MessagesClient.of({
        getInbox: read("getInbox", MessagesRequests.getInbox),
        getDrafts: read("getDrafts", MessagesRequests.getDrafts),
        getPermissions: read("getPermissions", MessagesRequests.getPermissions),
        getRecipientQuickfilters: read(
          "getRecipientQuickfilters",
          MessagesRequests.getRecipientQuickfilters,
        ),
        getRecipientFilter: call("getRecipientFilter", MessagesRequests.getRecipientFilter),
        filterComposeRecipients: call(
          "filterComposeRecipients",
          MessagesRequests.filterComposeRecipients,
        ),
        searchRecipients: call("searchRecipients", MessagesRequests.searchRecipients),
        getSent: read("getSent", MessagesRequests.getSent),
        getStatus: read("getStatus", MessagesRequests.getStatus),
        getReplyForm: call("getReplyForm", MessagesRequests.getReplyForm),
        getMessage: call("getMessage", MessagesRequests.getMessage),
      });
    }),
  );
}

export type {
  MessageComposeRecipientsRequest,
  MessageDetailRequest,
  MessageRecipientFilterRequest,
  MessageRecipientSearchRequest,
  MessageReplyFormRequest,
};
