import { Schema } from "effect";

export const UserContactDataSchema = Schema.Struct({
  email: Schema.NullOr(Schema.String),
  telephoneNumber: Schema.NullOr(Schema.String),
  mobileNumber: Schema.NullOr(Schema.String),
  street: Schema.NullOr(Schema.String),
  postCode: Schema.NullOr(Schema.String),
  city: Schema.NullOr(Schema.String),
  areContactDetailsWriteable: Schema.Boolean,
  userEmailMissingOrDifferentToMasterData: Schema.Boolean
});

export type UserContactData = Schema.Schema.Type<typeof UserContactDataSchema>;

export const UserEmailSchema = Schema.Struct({
  email: Schema.String
});

export type UserEmail = Schema.Schema.Type<typeof UserEmailSchema>;
