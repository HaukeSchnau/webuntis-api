import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import {
  type MessageDetailRequest,
  type MessageRecipientFilterRequest,
  type MessageRecipientSearchRequest,
  type MessageReplyFormRequest,
  MessagesRequests,
} from "./requests.ts";
import type {
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
    request: MessageRecipientFilterRequest,
  ) => Effect.Effect<MessageRecipientFilter, RequestFailure>;
  readonly searchRecipients: (
    request: MessageRecipientSearchRequest,
  ) => Effect.Effect<MessageRecipientSearch, RequestFailure>;
  readonly getSent: () => Effect.Effect<MessageSent, RequestFailure>;
  readonly getStatus: () => Effect.Effect<MessagesStatus, RequestFailure>;
  readonly getReplyForm: (
    request: MessageReplyFormRequest,
  ) => Effect.Effect<MessageReplyForm, RequestFailure>;
  readonly getMessage: (
    request: MessageDetailRequest,
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
          function* (request: MessageRecipientFilterRequest) {
            return yield* http.requestSchema(
              MessagesRequests.getRecipientFilter,
              request,
            );
          },
        ),
        searchRecipients: Effect.fn("MessagesClient.searchRecipients")(
          function* (request: MessageRecipientSearchRequest) {
            return yield* http.requestSchema(
              MessagesRequests.searchRecipients,
              request,
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
          request: MessageReplyFormRequest,
        ) {
          return yield* http.requestSchema(
            MessagesRequests.getReplyForm,
            request,
          );
        }),
        getMessage: Effect.fn("MessagesClient.getMessage")(function* (
          request: MessageDetailRequest,
        ) {
          return yield* http.requestSchema(
            MessagesRequests.getMessage,
            request,
          );
        }),
      });
    }),
  );
}

export type {
  MessageDetailRequest,
  MessageRecipientFilterRequest,
  MessageRecipientSearchRequest,
  MessageReplyFormRequest,
} from "./requests.ts";
