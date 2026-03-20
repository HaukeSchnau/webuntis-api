import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import { MessagesRequests } from "./requests.ts";
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
} from "./schema.ts";

export interface MessagesClientShape {
  readonly getInbox: () => Effect.Effect<MessagesInbox, RequestFailure>;
  readonly getDrafts: () => Effect.Effect<MessageDrafts, RequestFailure>;
  readonly getPermissions: () => Effect.Effect<
    MessagesPermissions,
    RequestFailure
  >;
  readonly getRecipientQuickfilters: () => Effect.Effect<
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
  readonly getSent: () => Effect.Effect<MessageSent, RequestFailure>;
  readonly getStatus: () => Effect.Effect<MessagesStatus, RequestFailure>;
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
        getInbox: Effect.fn("MessagesClient.getInbox")(function* () {
          return yield* http.requestSchema(
            MessagesRequests.getInbox,
            undefined,
          );
        }),
        getDrafts: Effect.fn("MessagesClient.getDrafts")(function* () {
          return yield* http.requestSchema(
            MessagesRequests.getDrafts,
            undefined,
          );
        }),
        getPermissions: Effect.fn("MessagesClient.getPermissions")(
          function* () {
            return yield* http.requestSchema(
              MessagesRequests.getPermissions,
              undefined,
            );
          },
        ),
        getRecipientQuickfilters: Effect.fn(
          "MessagesClient.getRecipientQuickfilters",
        )(function* () {
          return yield* http.requestSchema(
            MessagesRequests.getRecipientQuickfilters,
            undefined,
          );
        }),
        getRecipientFilter: Effect.fn("MessagesClient.getRecipientFilter")(
          function* (recipientOption: MessageRecipientOption) {
            return yield* http.requestSchema(
              MessagesRequests.getRecipientFilter,
              recipientOption,
            );
          },
        ),
        searchRecipients: Effect.fn("MessagesClient.searchRecipients")(
          function* (
            recipientOption: MessageRecipientOption,
            searchText: string,
          ) {
            return yield* http.requestSchema(
              MessagesRequests.searchRecipients,
              {
                recipientOption,
                searchText,
              },
            );
          },
        ),
        getSent: Effect.fn("MessagesClient.getSent")(function* () {
          return yield* http.requestSchema(MessagesRequests.getSent, undefined);
        }),
        getStatus: Effect.fn("MessagesClient.getStatus")(function* () {
          return yield* http.requestSchema(
            MessagesRequests.getStatus,
            undefined,
          );
        }),
        getReplyForm: Effect.fn("MessagesClient.getReplyForm")(function* (
          id: number,
        ) {
          return yield* http.requestSchema(MessagesRequests.getReplyForm, id);
        }),
        getMessage: Effect.fn("MessagesClient.getMessage")(function* (
          id: number,
        ) {
          return yield* http.requestSchema(MessagesRequests.getMessage, id);
        }),
      });
    }),
  );
}
