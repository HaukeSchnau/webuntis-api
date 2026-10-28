import { Schema } from "effect";
import { EntityId } from "../../internal/schema.ts";

/** One school as WebUntis' school search describes it. */
export const SchoolSchema = Schema.Struct({
  displayName: Schema.String,
  loginName: Schema.String,
  schoolId: EntityId,
  tenantId: Schema.String,
  server: Schema.String,
  serverUrl: Schema.String,
  address: Schema.String,
  mobileServiceUrl: Schema.optional(Schema.NullOr(Schema.String)),
  useMobileServiceUrlAndroid: Schema.optional(Schema.Boolean),
  useMobileServiceUrlIos: Schema.optional(Schema.Boolean),
});
export type School = typeof SchoolSchema.Type;
