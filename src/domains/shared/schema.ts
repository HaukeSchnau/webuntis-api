import { Schema } from "effect";
import { EntityId } from "../../internal/schema.ts";

export const JsonObjectSchema = Schema.Record(Schema.String, Schema.Json);

export type JsonObject = Schema.Schema.Type<typeof JsonObjectSchema>;

/**
 * WebUntis encodes every bounded interval as a `start`/`end` string pair. The
 * two exported names differ only in the value space their strings carry.
 */
const BoundedRangeSchema = Schema.Struct({
  start: Schema.String,
  end: Schema.String,
});

/** Calendar-date interval, e.g. `2026-03-23` to `2026-03-27`. */
export const DateRangeSchema = BoundedRangeSchema;

export type DateRange = Schema.Schema.Type<typeof DateRangeSchema>;

/** Wall-clock interval within a single day. */
export const TimeRangeSchema = BoundedRangeSchema;

export type TimeRange = Schema.Schema.Type<typeof TimeRangeSchema>;

/**
 * The four-field identity WebUntis attaches to every referenceable entity:
 * classes, teachers, subjects, rooms, departments, exam types, and grading
 * scales all decode through this shape.
 */
export const DisplayResourceSchema = Schema.Struct({
  id: EntityId,
  shortName: Schema.String,
  longName: Schema.String,
  displayName: Schema.String,
});

export type DisplayResource = Schema.Schema.Type<typeof DisplayResourceSchema>;

export const TimeGridUnitSchema = Schema.Struct({
  unitOfDay: Schema.Int,
  startTime: Schema.Int,
  endTime: Schema.Int,
});

export type TimeGridUnit = Schema.Schema.Type<typeof TimeGridUnitSchema>;

export const TimeGridSchema = Schema.Struct({
  schoolyearId: EntityId,
  units: Schema.Array(TimeGridUnitSchema),
});

export type TimeGrid = Schema.Schema.Type<typeof TimeGridSchema>;

export const SchoolyearSchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  dateRange: DateRangeSchema,
});

export type Schoolyear = Schema.Schema.Type<typeof SchoolyearSchema>;

export const SchoolyearWithTimeGridSchema = Schema.Struct({
  ...SchoolyearSchema.fields,
  timeGrid: TimeGridSchema,
});

export type SchoolyearWithTimeGrid = Schema.Schema.Type<typeof SchoolyearWithTimeGridSchema>;

export const TenantSchema = Schema.Struct({
  displayName: Schema.String,
  id: Schema.String,
  name: Schema.String,
  wuHostName: Schema.optional(Schema.NullOr(Schema.String)),
});

export type Tenant = Schema.Schema.Type<typeof TenantSchema>;

export const UserPersonSchema = Schema.Struct({
  displayName: Schema.String,
  id: EntityId,
  imageUrl: Schema.NullOr(Schema.String),
});

export type UserPerson = Schema.Schema.Type<typeof UserPersonSchema>;

export const UserSchema = Schema.Struct({
  id: EntityId,
  locale: Schema.String,
  name: Schema.String,
  email: Schema.NullOr(Schema.String),
  permissions: Schema.Struct({
    views: Schema.Array(Schema.String),
  }),
  person: Schema.optional(UserPersonSchema),
  roles: Schema.Array(Schema.String),
  students: Schema.optional(Schema.Array(JsonObjectSchema)),
  lastLogin: Schema.optional(Schema.String),
});

export type User = Schema.Schema.Type<typeof UserSchema>;

export const HolidaySchema = Schema.Struct({
  id: EntityId,
  name: Schema.String,
  start: Schema.String,
  end: Schema.String,
  bookable: Schema.Boolean,
});

export type Holiday = Schema.Schema.Type<typeof HolidaySchema>;
