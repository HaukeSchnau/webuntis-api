import { Data } from "effect";

export class SchoolSearchError extends Data.TaggedError("SchoolSearchError")<{
  readonly query: string;
  readonly message: string;
}> {}

export class AuthenticationError extends Data.TaggedError("AuthenticationError")<{
  readonly message: string;
  readonly stage: "bootstrap" | "login" | "token";
  readonly status?: number | undefined;
}> {}

export class UnexpectedResponseError extends Data.TaggedError("UnexpectedResponseError")<{
  readonly path: string;
  readonly status: number;
  readonly body: string;
}> {}

export class MissingConfigurationError extends Data.TaggedError("MissingConfigurationError")<{
  readonly fields: ReadonlyArray<string>;
}> {}

export class SchemaDriftError extends Data.TaggedError("SchemaDriftError")<{
  readonly path: string;
  readonly message: string;
}> {}
