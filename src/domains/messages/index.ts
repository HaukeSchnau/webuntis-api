import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import type {
  MessageDetail,
  MessageDrafts,
  MessageRecipientFilter,
  MessageRecipientOption,
  MessageRecipientQuickfilters,
  MessageRecipientSearch,
  MessageReplyForm,
  MessageSent,
  MessagesInbox,
  MessagesPermissions,
  MessagesStatus,
} from "../schemas/messages.ts";
import { MessagesRequests } from "./requests.ts";

export interface MessagesClientShape {
  readonly getInbox: Effect.Effect<MessagesInbox, RequestFailure>;
  readonly getDrafts: Effect.Effect<MessageDrafts, RequestFailure>;
  readonly getPermissions: Effect.Effect<MessagesPermissions, RequestFailure>;
  readonly getRecipientQuickfilters: Effect.Effect<
    MessageRecipientQuickfilters,
    RequestFailure
  >;
  readonly getRecipientFilter: (
    recipientOption: MessageRecipientOption,
  ) => Effect.Effect<MessageRecipientFilter, RequestFailure>;
  readonly searchRecipients: (
    recipientOption: MessageRecipientOption,
    searchText: string,
  ) => Effect.Effect<MessageRecipientSearch, RequestFailure>;
  readonly getSent: Effect.Effect<MessageSent, RequestFailure>;
  readonly getStatus: Effect.Effect<MessagesStatus, RequestFailure>;
  readonly getReplyForm: (
    id: number,
  ) => Effect.Effect<MessageReplyForm, RequestFailure>;
  readonly getMessage: (
    id: number,
  ) => Effect.Effect<MessageDetail, RequestFailure>;
}

export class MessagesClient extends ServiceMap.Service<
  MessagesClient,
  MessagesClientShape
>()("webuntis/MessagesClient") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return MessagesClient.of({
        getInbox: http.requestSchema(MessagesRequests.getInbox, undefined),
        getDrafts: http.requestSchema(MessagesRequests.getDrafts, undefined),
        getPermissions: http.requestSchema(
          MessagesRequests.getPermissions,
          undefined,
        ),
        getRecipientQuickfilters: http.requestSchema(
          MessagesRequests.getRecipientQuickfilters,
          undefined,
        ),
        getRecipientFilter: (recipientOption) =>
          http.requestSchema(
            MessagesRequests.getRecipientFilter,
            recipientOption,
          ),
        searchRecipients: (recipientOption, searchText) =>
          http.requestSchema(MessagesRequests.searchRecipients, {
            recipientOption,
            searchText,
          }),
        getSent: http.requestSchema(MessagesRequests.getSent, undefined),
        getStatus: http.requestSchema(MessagesRequests.getStatus, undefined),
        getReplyForm: (id) =>
          http.requestSchema(MessagesRequests.getReplyForm, id),
        getMessage: (id) => http.requestSchema(MessagesRequests.getMessage, id),
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}
