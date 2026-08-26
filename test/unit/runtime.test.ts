import { describe, expect, it } from "@effect/vitest";
import { Duration, Effect, Fiber } from "effect";
import { TestClock } from "effect/testing";
import { withTransientRetries } from "../../src/internal/runtime.ts";
import { makeMockHttpClient } from "./helpers.ts";

describe("WebUntis transport retries", () => {
  it.effect("retries transient responses at the request boundary", () =>
    Effect.gen(function* () {
      let attempts = 0;
      const client = withTransientRetries(
        makeMockHttpClient(() => {
          attempts += 1;
          return new Response(null, { status: attempts < 3 ? 503 : 200 });
        }),
      );

      const fiber = yield* client.get("https://example.test/data").pipe(Effect.forkChild);
      yield* Effect.yieldNow;
      yield* TestClock.adjust(Duration.seconds(5));

      expect((yield* Fiber.join(fiber)).status).toBe(200);
      expect(attempts).toBe(3);
    }),
  );

  it.effect("does not retry permanent responses", () =>
    Effect.gen(function* () {
      let attempts = 0;
      const client = withTransientRetries(
        makeMockHttpClient(() => {
          attempts += 1;
          return new Response(null, { status: 400 });
        }),
      );

      expect((yield* client.get("https://example.test/data")).status).toBe(400);
      expect(attempts).toBe(1);
    }),
  );
});
