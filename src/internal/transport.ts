import { type Duration, Effect, Schedule, Semaphore } from "effect";
import { HttpClient } from "effect/http";
import type { RateLimiter } from "effect/persistence";

/** Per-connection limits on how hard the client may use WebUntis. Both default to unlimited. */
export interface ConnectionLimits {
  /** Most requests in flight at once, counting logins and retries. */
  readonly concurrency?: number | undefined;
  /**
   * Most requests to send per `window`. Requests beyond the budget wait for it
   * to refill instead of failing. Every attempt counts, including retries.
   */
  readonly budget?: { readonly requests: number; readonly window: Duration.Input } | undefined;
}

const transientRetrySchedule = Schedule.exponential("500 millis").pipe(Schedule.jittered);

/**
 * Retries transport failures, timeouts, rate limiting, and transient HTTP responses before the
 * WebUntis protocol layer decodes them, waiting at least as long as a `Retry-After` header asks.
 * Permanent response and schema failures remain single-shot.
 */
export const withTransientRetries = <E, R>(client: HttpClient.HttpClient.With<E, R>) =>
  client.pipe(
    HttpClient.retryTransient({
      retryOn: "errors-and-responses",
      schedule: transientRetrySchedule,
      times: 2,
    }),
  );

/**
 * Applies a connection's policy to the caller's client: the request budget per
 * attempt, transient retries around it, and the concurrency limit around both,
 * so a request waiting to retry keeps its slot.
 */
export const makeConnectionClient = (
  base: HttpClient.HttpClient,
  limiter: RateLimiter.RateLimiter,
  limits: ConnectionLimits = {},
) =>
  Effect.gen(function* () {
    const { budget, concurrency } = limits;
    const budgeted =
      budget === undefined
        ? base
        : base.pipe(
            HttpClient.withRateLimiter({
              limiter,
              key: "connection",
              algorithm: "token-bucket",
              limit: budget.requests,
              window: budget.window,
              // Retrying a 429 is `withTransientRetries`' job; the limiter only
              // slows every request of the connection down after one.
              times: 0,
            }),
            // The limiter waits instead of failing, and its in-memory store has
            // no failure mode, so a `RateLimiterError` here is a bug.
            HttpClient.catchTag("RateLimiterError", (error) => Effect.die(error)),
          );
    const retried = withTransientRetries(budgeted);
    if (concurrency === undefined) {
      return retried;
    }

    const semaphore = yield* Semaphore.make(concurrency);
    return HttpClient.transform(retried, (effect) => semaphore.withPermit(effect));
  });
