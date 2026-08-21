import { Schema } from "effect";
import { EntityId } from "../../internal/schema.ts";
import { JsonObjectSchema } from "../shared/schema.ts";

export const MessagesStatusSchema = Schema.Struct({
  unreadMessagesCount: Schema.Int,
});

export type MessagesStatus = Schema.Schema.Type<typeof MessagesStatusSchema>;

export const MessageSenderSchema = Schema.Struct({
  className: Schema.NullOr(Schema.String),
  displayName: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  userId: EntityId,
});

export type MessageSender = Schema.Schema.Type<typeof MessageSenderSchema>;

export const MessageSummarySchema = Schema.Struct({
  id: EntityId,
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
  readConfirmationMessages: Schema.Array(JsonObjectSchema),
});

export type MessagesInbox = Schema.Schema.Type<typeof MessagesInboxSchema>;

export const MessageRecipientOptionSchema = Schema.Literals([
  "PARENTS",
  "STUDENTS",
  "STAFF",
  "TEACHER",
  "CUSTOM",
]);

export type MessageRecipientOption = Schema.Schema.Type<typeof MessageRecipientOptionSchema>;

export const MessagesPermissionsSchema = Schema.Struct({
  recipientOptions: Schema.Array(MessageRecipientOptionSchema),
  allowRequestReadConfirmation: Schema.Boolean,
  recipientSearchMaxResult: Schema.Int,
  showDraftsTab: Schema.Boolean,
  showSentTab: Schema.Boolean,
  canForbidReplies: Schema.Boolean,
  maxFileSize: Schema.Int,
  maxFileCount: Schema.Int,
});

export type MessagesPermissions = Schema.Schema.Type<typeof MessagesPermissionsSchema>;

export const MessageQuickfilterItemSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  personCount: Schema.Int,
  deletable: Schema.Boolean,
  editable: Schema.Boolean,
  publicAccess: Schema.Boolean,
  dynamic: Schema.Boolean,
});

export type MessageQuickfilterItem = Schema.Schema.Type<typeof MessageQuickfilterItemSchema>;

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

export type MessageRecipientFilterGroup = Schema.Schema.Type<
  typeof MessageRecipientFilterGroupSchema
>;

export const MessageRecipientFilterSchema = Schema.Struct({
  filters: Schema.Array(MessageRecipientFilterGroupSchema),
});

export type MessageRecipientFilter = Schema.Schema.Type<typeof MessageRecipientFilterSchema>;

export const MessageRecipientSearchResultSchema = Schema.Struct({
  personId: EntityId,
  className: Schema.NullOr(Schema.String),
  displayName: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  role: Schema.String,
});

export type MessageRecipientSearchResult = Schema.Schema.Type<
  typeof MessageRecipientSearchResultSchema
>;

export const MessageRecipientSearchSchema = Schema.Array(MessageRecipientSearchResultSchema);

export type MessageRecipientSearch = Schema.Schema.Type<typeof MessageRecipientSearchSchema>;

export const MessageComposeRecipientUserSchema = Schema.Struct({
  id: EntityId,
  displayName: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  role: Schema.String,
  tags: Schema.Array(Schema.Unknown),
  className: Schema.NullOr(Schema.String),
});

export type MessageComposeRecipientUser = Schema.Schema.Type<
  typeof MessageComposeRecipientUserSchema
>;

export const MessageComposeRecipientsSchema = Schema.Struct({
  users: Schema.Array(MessageComposeRecipientUserSchema),
});

export type MessageComposeRecipients = Schema.Schema.Type<typeof MessageComposeRecipientsSchema>;

export const MessageAttachmentSchema = JsonObjectSchema;

export type MessageAttachment = Schema.Schema.Type<typeof MessageAttachmentSchema>;
export const MessageRecipientSchema = JsonObjectSchema;

export type MessageRecipient = Schema.Schema.Type<typeof MessageRecipientSchema>;
export const MessageReplyHistoryEntrySchema = JsonObjectSchema;

export type MessageReplyHistoryEntry = Schema.Schema.Type<typeof MessageReplyHistoryEntrySchema>;
export const MessageRequestConfirmationSchema = JsonObjectSchema;

export type MessageRequestConfirmation = Schema.Schema.Type<
  typeof MessageRequestConfirmationSchema
>;

export const MessageDetailSchema = Schema.Struct({
  id: EntityId,
  subject: Schema.String,
  content: Schema.NullOr(Schema.String),
  sender: MessageSenderSchema,
  sentDateTime: Schema.String,
  allowMessageDeletion: Schema.Boolean,
  attachments: Schema.Array(MessageAttachmentSchema),
  blobAttachment: Schema.NullOr(MessageAttachmentSchema),
  storageAttachments: Schema.Array(MessageAttachmentSchema),
  isReply: Schema.Boolean,
  isReplyAllowed: Schema.Boolean,
  isReportMessage: Schema.Boolean,
  isReplyForbidden: Schema.Boolean,
  replyHistory: Schema.Array(MessageReplyHistoryEntrySchema),
  requestConfirmation: Schema.NullOr(MessageRequestConfirmationSchema),
});

export type MessageDetail = Schema.Schema.Type<typeof MessageDetailSchema>;

export const MessageReplyHistoryItemSchema = Schema.Struct({
  id: EntityId,
  subject: Schema.String,
  content: Schema.NullOr(Schema.String),
  sender: MessageSenderSchema,
  recipients: Schema.Array(MessageRecipientSchema),
  sentDateTime: Schema.String,
  isRevoked: Schema.Boolean,
  attachments: Schema.Array(MessageAttachmentSchema),
  blobAttachment: Schema.NullOr(MessageAttachmentSchema),
  storageAttachments: Schema.Array(MessageAttachmentSchema),
});

export type MessageReplyHistoryItem = Schema.Schema.Type<typeof MessageReplyHistoryItemSchema>;

export const MessageReplyFormSchema = Schema.Struct({
  subject: Schema.String,
  recipient: Schema.Struct({
    id: EntityId,
    className: Schema.NullOr(Schema.String),
    displayName: Schema.String,
  }),
  replyHistory: Schema.Array(MessageReplyHistoryItemSchema),
});

export type MessageReplyForm = Schema.Schema.Type<typeof MessageReplyFormSchema>;

export const MessageDraftSummarySchema = Schema.Struct({
  id: EntityId,
  subject: Schema.String,
  contentPreview: Schema.NullOr(Schema.String),
  hasAttachments: Schema.Boolean,
});

export type MessageDraftSummary = Schema.Schema.Type<typeof MessageDraftSummarySchema>;

export const MessageDraftsSchema = Schema.Struct({
  draftMessages: Schema.Array(MessageDraftSummarySchema),
});

export type MessageDrafts = Schema.Schema.Type<typeof MessageDraftsSchema>;

export const MessageSentSummarySchema = Schema.Struct({
  id: EntityId,
  subject: Schema.String,
  contentPreview: Schema.NullOr(Schema.String),
  sentDateTime: Schema.String,
  hasAttachments: Schema.Boolean,
});

export type MessageSentSummary = Schema.Schema.Type<typeof MessageSentSummarySchema>;

export const MessageSentSchema = Schema.Struct({
  sentMessages: Schema.Array(MessageSentSummarySchema),
});

export type MessageSent = Schema.Schema.Type<typeof MessageSentSchema>;
