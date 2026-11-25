import { Schema } from "effect";
import { EntityId } from "../../internal/schema.ts";
import { JsonObjectSchema } from "../shared/schema.ts";

export const MessagesStatusSchema = Schema.Struct({
  unreadMessagesCount: Schema.Int,
});

export type MessagesStatus = typeof MessagesStatusSchema.Type;

export const MessageSenderSchema = Schema.Struct({
  className: Schema.NullOr(Schema.String),
  displayName: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  userId: EntityId,
});

export type MessageSender = typeof MessageSenderSchema.Type;

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

export type MessageSummary = typeof MessageSummarySchema.Type;

export const MessagesInboxSchema = Schema.Struct({
  incomingMessages: Schema.Array(MessageSummarySchema),
  readConfirmationMessages: Schema.Array(JsonObjectSchema),
});

export type MessagesInbox = typeof MessagesInboxSchema.Type;

export const MessageRecipientOptionSchema = Schema.Literals([
  "PARENTS",
  "STUDENTS",
  "STAFF",
  "TEACHER",
  "CUSTOM",
]);

export type MessageRecipientOption = typeof MessageRecipientOptionSchema.Type;

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

export type MessagesPermissions = typeof MessagesPermissionsSchema.Type;

export const MessageQuickfilterItemSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  personCount: Schema.Int,
  deletable: Schema.Boolean,
  editable: Schema.Boolean,
  publicAccess: Schema.Boolean,
  dynamic: Schema.Boolean,
});

export type MessageQuickfilterItem = typeof MessageQuickfilterItemSchema.Type;

export const MessageRecipientQuickfiltersSchema = Schema.Struct({
  canCreatePublic: Schema.Boolean,
  items: Schema.Array(MessageQuickfilterItemSchema),
});

export type MessageRecipientQuickfilters = typeof MessageRecipientQuickfiltersSchema.Type;

export const MessageRecipientFilterGroupSchema = Schema.Struct({
  type: Schema.String,
  items: Schema.Array(Schema.String),
});

export type MessageRecipientFilterGroup = typeof MessageRecipientFilterGroupSchema.Type;

export const MessageRecipientFilterSchema = Schema.Struct({
  filters: Schema.Array(MessageRecipientFilterGroupSchema),
});

export type MessageRecipientFilter = typeof MessageRecipientFilterSchema.Type;

export const MessageRecipientSearchResultSchema = Schema.Struct({
  personId: EntityId,
  className: Schema.NullOr(Schema.String),
  displayName: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  role: Schema.String,
});

export type MessageRecipientSearchResult = typeof MessageRecipientSearchResultSchema.Type;

export const MessageRecipientSearchSchema = Schema.Array(MessageRecipientSearchResultSchema);

export type MessageRecipientSearch = typeof MessageRecipientSearchSchema.Type;

export const MessageComposeRecipientUserSchema = Schema.Struct({
  id: EntityId,
  displayName: Schema.String,
  imageUrl: Schema.NullOr(Schema.String),
  role: Schema.String,
  tags: Schema.Array(Schema.Unknown),
  className: Schema.NullOr(Schema.String),
});

export type MessageComposeRecipientUser = typeof MessageComposeRecipientUserSchema.Type;

export const MessageComposeRecipientsSchema = Schema.Struct({
  users: Schema.Array(MessageComposeRecipientUserSchema),
});

export type MessageComposeRecipients = typeof MessageComposeRecipientsSchema.Type;

export const MessageAttachmentSchema = JsonObjectSchema;

export type MessageAttachment = typeof MessageAttachmentSchema.Type;

export const MessageRecipientSchema = JsonObjectSchema;

export type MessageRecipient = typeof MessageRecipientSchema.Type;

export const MessageReplyHistoryEntrySchema = JsonObjectSchema;

export type MessageReplyHistoryEntry = typeof MessageReplyHistoryEntrySchema.Type;

export const MessageRequestConfirmationSchema = JsonObjectSchema;

export type MessageRequestConfirmation = typeof MessageRequestConfirmationSchema.Type;

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

export type MessageDetail = typeof MessageDetailSchema.Type;

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

export type MessageReplyHistoryItem = typeof MessageReplyHistoryItemSchema.Type;

export const MessageReplyFormSchema = Schema.Struct({
  subject: Schema.String,
  recipient: Schema.Struct({
    id: EntityId,
    className: Schema.NullOr(Schema.String),
    displayName: Schema.String,
  }),
  replyHistory: Schema.Array(MessageReplyHistoryItemSchema),
});

export type MessageReplyForm = typeof MessageReplyFormSchema.Type;

export const MessageDraftSummarySchema = Schema.Struct({
  id: EntityId,
  subject: Schema.String,
  contentPreview: Schema.NullOr(Schema.String),
  hasAttachments: Schema.Boolean,
});

export type MessageDraftSummary = typeof MessageDraftSummarySchema.Type;

export const MessageDraftsSchema = Schema.Struct({
  draftMessages: Schema.Array(MessageDraftSummarySchema),
});

export type MessageDrafts = typeof MessageDraftsSchema.Type;

export const MessageSentSummarySchema = Schema.Struct({
  id: EntityId,
  subject: Schema.String,
  contentPreview: Schema.NullOr(Schema.String),
  sentDateTime: Schema.String,
  hasAttachments: Schema.Boolean,
});

export type MessageSentSummary = typeof MessageSentSummarySchema.Type;

export const MessageSentSchema = Schema.Struct({
  sentMessages: Schema.Array(MessageSentSummarySchema),
});

export type MessageSent = typeof MessageSentSchema.Type;
