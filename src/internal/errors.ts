import { Data } from "effect";
import * as HttpClientError from "effect/unstable/http/HttpClientError";

export class DiscoveryError extends Data.TaggedError("DiscoveryError")<{
  readonly query: string;
  readonly message: string;
  readonly matches?: ReadonlyArray<string> | undefined;
  readonly cause?: unknown;
}> {}

export class AuthError extends Data.TaggedError("AuthError")<{
  readonly stage: "discovery" | "bootstrap" | "login" | "token" | "metadata";
  readonly message: string;
  readonly status?: number | undefined;
  readonly cause?: unknown;
}> {}

export class TransportError extends Data.TaggedError("TransportError")<{
  readonly method: string;
  readonly path: string;
  readonly message: string;
  readonly status?: number | undefined;
  readonly body?: string | undefined;
  readonly cause?: unknown;
}> {}

export class DecodeError extends Data.TaggedError("DecodeError")<{
  readonly path: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type WebUntisError =
  | DiscoveryError
  | AuthError
  | TransportError
  | DecodeError;

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
      message: String(error.reason),
      cause: error,
    });
  }

  return new TransportError({
    method,
    path,
    message: String(error),
    cause: error,
  });
};

export const decodeError = (path: string, error: unknown): DecodeError =>
  new DecodeError({
    path,
    message: String(error),
    cause: error,
  });

export {
  AuthError as AuthenticationError,
  ConfigurationError as MissingConfigurationError,
  DecodeError as SchemaDriftError,
  DiscoveryError as SchoolSearchError,
  TransportError as UnexpectedResponseError,
};
