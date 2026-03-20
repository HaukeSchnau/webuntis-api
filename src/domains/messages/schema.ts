import { Schema } from "effect";

export const MessagesStatusSchema = Schema.Struct({
  unreadMessagesCount: Schema.Number,
});

export type MessagesStatus = Schema.Schema.Type<typeof MessagesStatusSchema>;

export const MessageSenderSchema = Schema.Struct({
  className: Schema.NullOr(Schema.String),
  displayName: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  userId: Schema.Number,
});

export const MessageSummarySchema = Schema.Struct({
  id: Schema.Number,
  subject: Schema.String,
  contentPreview: Schema.NullOr(Schema.String),
  sender: MessageSenderSchema,
  sentDateTime: Schema.String,
  allowMessageDeletion: Schema.Boolean,
  hasAttachments: Schema.Boolean,
  isMessageRead: Schema.Boolean,
  isReply: Schema.Boolean,
  isReplyAllowed: Schema.Boolean,
});

export type MessageSummary = Schema.Schema.Type<typeof MessageSummarySchema>;

export const MessagesInboxSchema = Schema.Struct({
  incomingMessages: Schema.Array(MessageSummarySchema),
  readConfirmationMessages: Schema.Array(Schema.Unknown),
});

export type MessagesInbox = Schema.Schema.Type<typeof MessagesInboxSchema>;

export const MessageRecipientOptionSchema = Schema.Literals([
  "PARENTS",
  "STUDENTS",
  "STAFF",
  "TEACHER",
  "CUSTOM",
]);

export type MessageRecipientOption = Schema.Schema.Type<
  typeof MessageRecipientOptionSchema
>;

export const MessagesPermissionsSchema = Schema.Struct({
  recipientOptions: Schema.Array(MessageRecipientOptionSchema),
  allowRequestReadConfirmation: Schema.Boolean,
  recipientSearchMaxResult: Schema.Number,
  showDraftsTab: Schema.Boolean,
  showSentTab: Schema.Boolean,
  canForbidReplies: Schema.Boolean,
  maxFileSize: Schema.Number,
  maxFileCount: Schema.Number,
});

export type MessagesPermissions = Schema.Schema.Type<
  typeof MessagesPermissionsSchema
>;

export const MessageQuickfilterItemSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  personCount: Schema.Number,
  deletable: Schema.Boolean,
  editable: Schema.Boolean,
  publicAccess: Schema.Boolean,
  dynamic: Schema.Boolean,
});

export const MessageRecipientQuickfiltersSchema = Schema.Struct({
  canCreatePublic: Schema.Boolean,
  items: Schema.Array(MessageQuickfilterItemSchema),
});

export type MessageRecipientQuickfilters = Schema.Schema.Type<
  typeof MessageRecipientQuickfiltersSchema
>;

export const MessageRecipientFilterGroupSchema = Schema.Struct({
  type: Schema.String,
  items: Schema.Array(Schema.String),
});

export const MessageRecipientFilterSchema = Schema.Struct({
  filters: Schema.Array(MessageRecipientFilterGroupSchema),
});

export type MessageRecipientFilter = Schema.Schema.Type<
  typeof MessageRecipientFilterSchema
>;

export const MessageRecipientSearchResultSchema = Schema.Struct({
  personId: Schema.Number,
  className: Schema.NullOr(Schema.String),
  displayName: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  role: Schema.String,
});

export const MessageRecipientSearchSchema = Schema.Array(
  MessageRecipientSearchResultSchema,
);

export type MessageRecipientSearch = Schema.Schema.Type<
  typeof MessageRecipientSearchSchema
>;

export const MessageDetailSchema = Schema.Struct({
  id: Schema.Number,
  subject: Schema.String,
  content: Schema.NullOr(Schema.String),
  sender: MessageSenderSchema,
  sentDateTime: Schema.String,
  allowMessageDeletion: Schema.Boolean,
  attachments: Schema.Array(Schema.Unknown),
  blobAttachment: Schema.NullOr(Schema.Unknown),
  storageAttachments: Schema.Array(Schema.Unknown),
  isReply: Schema.Boolean,
  isReplyAllowed: Schema.Boolean,
  isReportMessage: Schema.Boolean,
  isReplyForbidden: Schema.Boolean,
  replyHistory: Schema.Array(Schema.Unknown),
  requestConfirmation: Schema.NullOr(Schema.Unknown),
});

export type MessageDetail = Schema.Schema.Type<typeof MessageDetailSchema>;

export const MessageReplyHistoryItemSchema = Schema.Struct({
  id: Schema.Number,
  subject: Schema.String,
  content: Schema.NullOr(Schema.String),
  sender: MessageSenderSchema,
  recipients: Schema.Array(Schema.Unknown),
  sentDateTime: Schema.String,
  isRevoked: Schema.Boolean,
  attachments: Schema.Array(Schema.Unknown),
  blobAttachment: Schema.NullOr(Schema.Unknown),
  storageAttachments: Schema.Array(Schema.Unknown),
});

export const MessageReplyFormSchema = Schema.Struct({
  subject: Schema.String,
  recipient: Schema.Struct({
    id: Schema.Number,
    className: Schema.NullOr(Schema.String),
    displayName: Schema.String,
  }),
  replyHistory: Schema.Array(MessageReplyHistoryItemSchema),
});

export type MessageReplyForm = Schema.Schema.Type<
  typeof MessageReplyFormSchema
>;

export const MessageDraftSummarySchema = Schema.Struct({
  id: Schema.Number,
  subject: Schema.String,
  contentPreview: Schema.NullOr(Schema.String),
  hasAttachments: Schema.Boolean,
});

export const MessageDraftsSchema = Schema.Struct({
  draftMessages: Schema.Array(MessageDraftSummarySchema),
});

export type MessageDrafts = Schema.Schema.Type<typeof MessageDraftsSchema>;

export const MessageSentSummarySchema = Schema.Struct({
  id: Schema.Number,
  subject: Schema.String,
  contentPreview: Schema.NullOr(Schema.String),
  sentDateTime: Schema.String,
  hasAttachments: Schema.Boolean,
});

export const MessageSentSchema = Schema.Struct({
  sentMessages: Schema.Array(MessageSentSummarySchema),
});

export type MessageSent = Schema.Schema.Type<typeof MessageSentSchema>;
