import { Effect, Schema } from "effect";
import { errorMessage, InvalidRequestError } from "./errors.ts";

export const RequestPolicy = {
  Metadata: "metadata",
  AuthOnly: "auth-only",
} as const;

export type RequestPolicy = (typeof RequestPolicy)[keyof typeof RequestPolicy];

export type QueryParams = Readonly<Record<string, string | number | boolean | undefined>>;
export type HeaderParams = Readonly<Record<string, string | undefined>>;

export interface RequestDescriptor<Input> {
  readonly operation?: string | undefined;
  readonly method: "GET" | "POST" | "PUT";
  readonly path: string | ((input: Input) => string);
  readonly policy: RequestPolicy;
  readonly query?: ((input: Input) => QueryParams) | undefined;
  readonly headers?: ((input: Input) => HeaderParams) | undefined;
  readonly body?: ((input: Input) => unknown) | undefined;
  readonly inputSchema?: Schema.Codec<Input, unknown, never, never> | undefined;
  readonly supportsSchoolYearScope?: boolean | undefined;
}

export interface SchemaRequestDescriptor<
  Input,
  S extends Schema.Top,
> extends RequestDescriptor<Input> {
  readonly schema: S;
}

export interface ResolvedRequestDescriptor {
  readonly method: "GET" | "POST" | "PUT";
  readonly path: string;
  readonly policy: RequestPolicy;
  readonly query?: QueryParams | undefined;
  readonly headers?: HeaderParams | undefined;
  readonly body?: unknown;
  readonly supportsSchoolYearScope?: boolean | undefined;
}

export const request = <Input>(descriptor: RequestDescriptor<Input>): RequestDescriptor<Input> =>
  descriptor;

export const schemaRequest = <Input, S extends Schema.Top>(
  descriptor: SchemaRequestDescriptor<Input, S>,
): SchemaRequestDescriptor<Input, S> => descriptor;

export const pathFor = <Input>(descriptor: RequestDescriptor<Input>, input: Input): string =>
  typeof descriptor.path === "function" ? descriptor.path(input) : descriptor.path;

export const resolveRequest = <Input>(
  descriptor: RequestDescriptor<Input>,
  input: Input,
): ResolvedRequestDescriptor => ({
  method: descriptor.method,
  path: pathFor(descriptor, input),
  policy: descriptor.policy,
  query: descriptor.query?.(input),
  headers: descriptor.headers?.(input),
  body: descriptor.body?.(input),
  supportsSchoolYearScope: descriptor.supportsSchoolYearScope,
});

const errorPathFor = <Input>(descriptor: RequestDescriptor<Input>): string =>
  typeof descriptor.path === "string"
    ? descriptor.path
    : (descriptor.operation ?? "<dynamic request path>");

export const validateRequest = <Input>(
  descriptor: RequestDescriptor<Input>,
  input: Input,
): Effect.Effect<Input, InvalidRequestError> => {
  if (descriptor.inputSchema === undefined) {
    return Effect.succeed(input);
  }

  return Schema.decodeUnknownEffect(descriptor.inputSchema)(input).pipe(
    Effect.mapError(
      (cause) =>
        new InvalidRequestError({
          path: errorPathFor(descriptor),
          message: errorMessage(cause),
          cause,
        }),
    ),
  );
};

export const validateAndResolveRequest = <Input>(
  descriptor: RequestDescriptor<Input>,
  input: Input,
): Effect.Effect<ResolvedRequestDescriptor, InvalidRequestError> =>
  validateRequest(descriptor, input).pipe(
    Effect.map((validatedInput) => resolveRequest(descriptor, validatedInput)),
  );

export const PositiveInteger = Schema.Int.check(
  Schema.isGreaterThan(0, { expected: "a positive integer" }),
);

const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

const isValidCalendarDate = (value: string): boolean => {
  const match = isoDatePattern.exec(value);
  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

export const IsoDate = Schema.String.check(
  Schema.makeFilter((value) => {
    const match = isoDatePattern.exec(value);
    if (match === null) {
      return "must be an ISO date in YYYY-MM-DD format";
    }
    return isValidCalendarDate(value) || "must be a valid calendar date";
  }),
);

const isoDateTimePattern =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})?$/;

export const DateTimeString = Schema.String.check(
  Schema.makeFilter((value) => {
    const match = isoDateTimePattern.exec(value);
    if (match === null) {
      return "must be a valid ISO date-time";
    }

    const hour = Number(match[2]);
    const minute = Number(match[3]);
    const second = match[4] === undefined ? 0 : Number(match[4]);
    return (
      (isValidCalendarDate(match[1] ?? "") &&
        hour <= 23 &&
        minute <= 59 &&
        second <= 59 &&
        !Number.isNaN(Date.parse(value))) ||
      "must be a valid ISO date-time"
    );
  }),
);

export const NonBlankString = Schema.String.check(
  Schema.makeFilter((value) => value.trim().length > 0 || "must not be blank"),
);

export const orderedRange = <T extends { readonly start: string; readonly end: string }>(
  schema: Schema.Codec<T, unknown, never, never>,
): Schema.Codec<T, unknown, never, never> =>
  schema.check(
    Schema.makeFilter((range) =>
      range.start <= range.end ? undefined : { path: ["end"], issue: "must not be before start" },
    ),
  );

export const orderedDateTimeRange = <
  T extends { readonly startDateTime: string; readonly endDateTime: string },
>(
  schema: Schema.Codec<T, unknown, never, never>,
): Schema.Codec<T, unknown, never, never> =>
  schema.check(
    Schema.makeFilter((range) =>
      Date.parse(range.startDateTime) <= Date.parse(range.endDateTime)
        ? undefined
        : { path: ["endDateTime"], issue: "must not be before startDateTime" },
    ),
  );
