# ADR 0005: Typed refusals and per-connection limits

Status: accepted

## Context

Up to 0.3 every refused request was a `TransportError` with a status code. A wrong password
surfaced as `AuthError { stage: "token", status: 302 }`, and a 403 dropped the session and
logged in again, which cannot grant a missing permission but does cost a login that may log out
another client of the same account. `Retry-After` was honored only by the generic transient
retry, and nothing bounded how hard one importer could hit a school.

## Decision

A non-2xx response is classified once, in `responseError`: 403 is `PermissionDenied`, 429 is
`RateLimited` with the server's last `Retry-After`, any other body with a WebUntis `errorCode`
is `UpstreamRejected`, and the rest stays `TransportError`. Only 401 renews the session
(ADR 0001's single retry is unchanged).

A redirect or 401 from `api/token/new` right after the login form is `InvalidCredentials`. The
session state remembers it, so later requests fail at once instead of retrying a wrong password
until WebUntis locks the account. `AuthClient.refresh` and `AuthClient.clear` are the explicit
ways to try again.

Each connection applies its policy to the caller's `HttpClient` in a fixed order: Effect's
`HttpClient.withRateLimiter` (token bucket, in-memory store per connection) per attempt,
`retryTransient` around it, and a `Semaphore` for concurrency around both. The limiter does not
retry 429s itself; it only holds back the connection's other requests after one.

## Consequences

Callers can tell a wrong password, a missing permission, throttling, and a rejected request
apart without parsing messages. A 403 never costs a login. Limits are opt-in, so a connection
without them behaves as before. The rate limiter is an `@stability unstable` Effect API, so an
Effect minor release may require adjusting `src/internal/transport.ts`.
