import { Option, Result, Schema } from "effect";
import { Headers, HttpClientError, type HttpClientResponse } from "effect/http";

export class DiscoveryError extends Schema.TaggedError<DiscoveryError>()("DiscoveryError", {
  query: Schema.String,
  message: Schema.String,
  matches: Schema.optional(Schema.Array(Schema.String)),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
  stage: Schema.Literals(["bootstrap", "login", "token", "metadata"]),
  message: Schema.String,
  status: Schema.optional(Schema.Int),
  cause: Schema.optional(Schema.Unknown),
}) {}

/**
 * WebUntis refused the credential. The connection does not try to log in
 * again until `AuthClient.refresh` or `AuthClient.clear`, so a wrong password
 * cannot lock the account through repeated attempts.
 */
export class InvalidCredentials extends Schema.TaggedError<InvalidCredentials>()(
  "InvalidCredentials",
  {
    school: Schema.String,
    message: Schema.String,
  },
) {}

/** The account may not read this resource (HTTP 403). The session stays valid. */
export class PermissionDenied extends Schema.TaggedError<PermissionDenied>()("PermissionDenied", {
  method: Schema.String,
  path: Schema.String,
  message: Schema.String,
  errorCode: Schema.optional(Schema.String),
  body: Schema.optional(Schema.String),
}) {}

/**
 * WebUntis kept answering HTTP 429 after the client waited as long as each
 * `Retry-After` asked. `retryAfter` is the server's last requested delay.
 */
export class RateLimited extends Schema.TaggedError<RateLimited>()("RateLimited", {
  method: Schema.String,
  path: Schema.String,
  message: Schema.String,
  retryAfter: Schema.optional(Schema.Duration),
}) {}

/**
 * WebUntis rejected the request and said why: the response body carried an
 * `errorCode` such as `VALIDATION_ERROR`. `body` holds the full response.
 */
export class UpstreamRejected extends Schema.TaggedError<UpstreamRejected>()("UpstreamRejected", {
  method: Schema.String,
  path: Schema.String,
  status: Schema.Int,
  errorCode: Schema.String,
  message: Schema.String,
  body: Schema.String,
}) {}

/** A request that never got an answer, or an answer WebUntis did not explain. */
export class TransportError extends Schema.TaggedError<TransportError>()("TransportError", {
  method: Schema.String,
  path: Schema.String,
  message: Schema.String,
  status: Schema.optional(Schema.Int),
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

/** Every failure logging in can produce, from resolving the school to minting a token. */
export type LoginError =
  | DiscoveryError
  | AuthError
  | InvalidCredentials
  | TransportError
  | DecodeError;

/**
 * Every failure a request can produce once the client is built: discovery,
 * authentication, refusals WebUntis explained, transport, response decoding,
 * and caller-input validation. `ConfigurationError` is deliberately absent
 * because it can only occur while building the client, never while running a
 * request.
 */
export type WebUntisError =
  | DiscoveryError
  | AuthError
  | InvalidCredentials
  | PermissionDenied
  | RateLimited
  | UpstreamRejected
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

const UpstreamErrorBody = Schema.fromJsonString(
  Schema.Struct({ errorCode: Schema.String, errorMessage: Schema.optional(Schema.String) }),
);
const decodeUpstreamErrorBody = Schema.decodeUnknownOption(UpstreamErrorBody);

const maxBodyExcerptLength = 500;

/**
 * Appends a bounded, single-line body excerpt to error messages. WebUntis explains rejected
 * requests in the body (for example `VALIDATION_ERROR`), and logged causes only show the message.
 */
const bodyExcerpt = (body: string) => {
  const text = body.replace(/\s+/gu, " ").trim();
  if (text === "") {
    return "";
  }
  return text.length > maxBodyExcerptLength
    ? `: ${text.slice(0, maxBodyExcerptLength)}…`
    : `: ${text}`;
};

/**
 * Classifies a non-2xx WebUntis REST response whose body has been read.
 * 403 and 429 keep their meaning regardless of the body; otherwise an
 * `errorCode` in the body makes the refusal an {@link UpstreamRejected}.
 */
export const responseError = (
  method: string,
  path: string,
  response: HttpClientResponse.HttpClientResponse,
  body: string,
  now: number,
): PermissionDenied | RateLimited | UpstreamRejected | TransportError => {
  const upstream = Option.getOrUndefined(decodeUpstreamErrorBody(body));
  const message = `HTTP ${response.status} for ${method} ${path}${bodyExcerpt(body)}`;

  if (response.status === 403) {
    return new PermissionDenied({ method, path, message, errorCode: upstream?.errorCode, body });
  }

  if (response.status === 429) {
    const retryAfter = response.headers["retry-after"];
    const parsed = retryAfter === undefined ? undefined : Headers.parseRetryAfter(retryAfter);
    return new RateLimited({
      method,
      path,
      message,
      retryAfter:
        parsed !== undefined && Result.isSuccess(parsed)
          ? Headers.retryAfterDelay(parsed.success, now)
          : undefined,
    });
  }

  if (upstream !== undefined) {
    return new UpstreamRejected({
      method,
      path,
      status: response.status,
      errorCode: upstream.errorCode,
      message,
      body,
    });
  }

  return new TransportError({ method, path, status: response.status, body, message });
};
