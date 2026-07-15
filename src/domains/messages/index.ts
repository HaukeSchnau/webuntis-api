import { Context, Effect, Layer } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
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
  readonly getInbox: Effect.Effect<MessagesInbox, RequestFailure>;
  readonly getDrafts: Effect.Effect<MessageDrafts, RequestFailure>;
  readonly getPermissions: Effect.Effect<MessagesPermissions, RequestFailure>;
  readonly getRecipientQuickfilters: Effect.Effect<MessageRecipientQuickfilters, RequestFailure>;
  readonly getRecipientFilter: (
    request: MessageRecipientFilterRequest,
  ) => Effect.Effect<MessageRecipientFilter, RequestFailure>;
  readonly filterComposeRecipients: (
    request: MessageComposeRecipientsRequest,
  ) => Effect.Effect<MessageComposeRecipients, RequestFailure>;
  readonly searchRecipients: (
    request: MessageRecipientSearchRequest,
  ) => Effect.Effect<MessageRecipientSearch, RequestFailure>;
  readonly getSent: Effect.Effect<MessageSent, RequestFailure>;
  readonly getStatus: Effect.Effect<MessagesStatus, RequestFailure>;
  readonly getReplyForm: (
    request: MessageReplyFormRequest,
  ) => Effect.Effect<MessageReplyForm, RequestFailure>;
  readonly getMessage: (
    request: MessageDetailRequest,
  ) => Effect.Effect<MessageDetail, RequestFailure>;
}

export class MessagesClient extends Context.Service<MessagesClient, MessagesClientShape>()(
  "webuntis/MessagesClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return MessagesClient.of({
        getInbox: http
          .requestSchema(MessagesRequests.getInbox, undefined)
          .pipe(Effect.withSpan("MessagesClient.getInbox")),
        getDrafts: http
          .requestSchema(MessagesRequests.getDrafts, undefined)
          .pipe(Effect.withSpan("MessagesClient.getDrafts")),
        getPermissions: http
          .requestSchema(MessagesRequests.getPermissions, undefined)
          .pipe(Effect.withSpan("MessagesClient.getPermissions")),
        getRecipientQuickfilters: http
          .requestSchema(MessagesRequests.getRecipientQuickfilters, undefined)
          .pipe(Effect.withSpan("MessagesClient.getRecipientQuickfilters")),
        getRecipientFilter: Effect.fn("MessagesClient.getRecipientFilter")(function* (
          request: MessageRecipientFilterRequest,
        ) {
          return yield* http.requestSchema(MessagesRequests.getRecipientFilter, request);
        }),
        filterComposeRecipients: Effect.fn("MessagesClient.filterComposeRecipients")(function* (
          request: MessageComposeRecipientsRequest,
        ) {
          return yield* http.requestSchema(MessagesRequests.filterComposeRecipients, request);
        }),
        searchRecipients: Effect.fn("MessagesClient.searchRecipients")(function* (
          request: MessageRecipientSearchRequest,
        ) {
          return yield* http.requestSchema(MessagesRequests.searchRecipients, request);
        }),
        getSent: http
          .requestSchema(MessagesRequests.getSent, undefined)
          .pipe(Effect.withSpan("MessagesClient.getSent")),
        getStatus: http
          .requestSchema(MessagesRequests.getStatus, undefined)
          .pipe(Effect.withSpan("MessagesClient.getStatus")),
        getReplyForm: Effect.fn("MessagesClient.getReplyForm")(function* (
          request: MessageReplyFormRequest,
        ) {
          return yield* http.requestSchema(MessagesRequests.getReplyForm, request);
        }),
        getMessage: Effect.fn("MessagesClient.getMessage")(function* (
          request: MessageDetailRequest,
        ) {
          return yield* http.requestSchema(MessagesRequests.getMessage, request);
        }),
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
} from "./requests.ts";
