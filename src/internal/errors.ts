import { Schema } from "effect";
import * as HttpClientError from "effect/unstable/http/HttpClientError";

export class DiscoveryError extends Schema.TaggedError<DiscoveryError>()("DiscoveryError", {
  query: Schema.String,
  message: Schema.String,
  matches: Schema.optional(Schema.Array(Schema.String)),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
  stage: Schema.Literals(["discovery", "bootstrap", "login", "token", "metadata"]),
  message: Schema.String,
  status: Schema.optional(Schema.Finite),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class TransportError extends Schema.TaggedError<TransportError>()("TransportError", {
  method: Schema.String,
  path: Schema.String,
  message: Schema.String,
  status: Schema.optional(Schema.Finite),
  body: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class DecodeError extends Schema.TaggedError<DecodeError>()("DecodeError", {
  path: Schema.String,
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class InvalidRequestError extends Schema.TaggedError<InvalidRequestError>()(
  "InvalidRequestError",
  {
    path: Schema.String,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class ConfigurationError extends Schema.TaggedError<ConfigurationError>()(
  "ConfigurationError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export type WebUntisError =
  | DiscoveryError
  | AuthError
  | TransportError
  | DecodeError
  | InvalidRequestError;

export const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

export const httpClientErrorToTransportError = (
  method: string,
  path: string,
  error: unknown,
): TransportError => {
  if (HttpClientError.isHttpClientError(error)) {
    if (error.reason._tag === "StatusCodeError") {
      return new TransportError({
        method,
        path,
        message: `HTTP ${error.reason.response.status} for ${method} ${path}`,
        status: error.reason.response.status,
        cause: error,
      });
    }

    return new TransportError({
      method,
      path,
      message: errorMessage(error.reason),
      cause: error,
    });
  }

  return new TransportError({
    method,
    path,
    message: errorMessage(error),
    cause: error,
  });
};

export const decodeError = (path: string, error: unknown): DecodeError =>
  new DecodeError({
    path,
    message: errorMessage(error),
    cause: error,
  });

export {
  AuthError as AuthenticationError,
  ConfigurationError as MissingConfigurationError,
  DecodeError as SchemaDriftError,
  DiscoveryError as SchoolSearchError,
  TransportError as UnexpectedResponseError,
};
