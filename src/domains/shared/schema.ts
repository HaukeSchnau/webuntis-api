import { Schema } from "effect";

export const JsonObjectSchema = Schema.Record(Schema.String, Schema.Json);

export const DateRangeSchema = Schema.Struct({
  start: Schema.String,
  end: Schema.String,
});

export const TimeRangeSchema = Schema.Struct({
  start: Schema.String,
  end: Schema.String,
});

export const TimeGridUnitSchema = Schema.Struct({
  unitOfDay: Schema.Number,
  startTime: Schema.Number,
  endTime: Schema.Number,
});

export const TimeGridSchema = Schema.Struct({
  schoolyearId: Schema.Number,
  units: Schema.Array(TimeGridUnitSchema),
});

export type TimeGrid = Schema.Schema.Type<typeof TimeGridSchema>;

export const SchoolyearSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  dateRange: DateRangeSchema,
});

export type Schoolyear = Schema.Schema.Type<typeof SchoolyearSchema>;

export const SchoolyearWithTimeGridSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  dateRange: DateRangeSchema,
  timeGrid: TimeGridSchema,
});

export const TenantSchema = Schema.Struct({
  displayName: Schema.String,
  id: Schema.String,
  name: Schema.String,
  wuHostName: Schema.optional(Schema.NullOr(Schema.String)),
});

export const UserSchema = Schema.Struct({
  id: Schema.Number,
  locale: Schema.String,
  name: Schema.String,
  email: Schema.NullOr(Schema.String),
  permissions: Schema.Struct({
    views: Schema.Array(Schema.String),
  }),
  person: Schema.optional(JsonObjectSchema),
  roles: Schema.Array(Schema.String),
  students: Schema.optional(Schema.Array(JsonObjectSchema)),
  lastLogin: Schema.optional(Schema.String),
});

export const HolidaySchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  start: Schema.String,
  end: Schema.String,
  bookable: Schema.Boolean,
});
