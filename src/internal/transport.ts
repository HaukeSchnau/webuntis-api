import { Schedule } from "effect";
import { HttpClient } from "effect/http";

const transientRetrySchedule = Schedule.exponential("500 millis").pipe(Schedule.jittered);

/**
 * Retries transport failures, timeouts, rate limiting, and transient HTTP responses before the
 * WebUntis protocol layer decodes them. Permanent response and schema failures remain single-shot.
 */
export const withTransientRetries = <E, R>(client: HttpClient.HttpClient.With<E, R>) =>
  client.pipe(
    HttpClient.retryTransient({
      retryOn: "errors-and-responses",
      schedule: transientRetrySchedule,
      times: 2,
    }),
  );
