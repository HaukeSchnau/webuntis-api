import { Data } from "effect";
import * as HttpClientError from "effect/unstable/http/HttpClientError";

export class DiscoveryError extends Data.TaggedError("DiscoveryError")<{
  readonly query: string;
  readonly message: string;
}> {}

export class AuthError extends Data.TaggedError("AuthError")<{
  readonly stage: "discovery" | "bootstrap" | "login" | "token" | "metadata";
  readonly message: string;
  readonly status?: number | undefined;
}> {}

export class TransportError extends Data.TaggedError("TransportError")<{
  readonly method: string;
  readonly path: string;
  readonly message: string;
  readonly status?: number | undefined;
  readonly body?: string | undefined;
}> {}

export class DecodeError extends Data.TaggedError("DecodeError")<{
  readonly path: string;
  readonly message: string;
}> {}

export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
  readonly message: string;
}> {}

export type WebUntisError =
  | DiscoveryError
  | AuthError
  | TransportError
  | DecodeError;

export const httpClientErrorToTransportError = (
  method: string,
  path: string,
  error: unknown
): TransportError => {
  if (HttpClientError.isHttpClientError(error)) {
    if (error.reason._tag === "StatusCodeError") {
      return new TransportError({
        method,
        path,
        message: `HTTP ${error.reason.response.status} for ${method} ${path}`,
        status: error.reason.response.status
      });
    }

    return new TransportError({
      method,
      path,
      message: String(error.reason)
    });
  }

  return new TransportError({
    method,
    path,
    message: String(error)
  });
};

export const decodeError = (path: string, error: unknown): DecodeError =>
  new DecodeError({
    path,
    message: String(error)
  });

export {
  AuthError as AuthenticationError,
  ConfigurationError as MissingConfigurationError,
  DecodeError as SchemaDriftError,
  DiscoveryError as SchoolSearchError,
  TransportError as UnexpectedResponseError
};
