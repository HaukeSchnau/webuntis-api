import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { fromEnv } from "../../src/core/config.ts";
import { ConfigurationError } from "../../src/core/errors.ts";

describe("config loading", () => {
  it.effect("accepts direct serverUrl overrides without WEBUNTIS_SERVER", () =>
    Effect.gen(function*() {
      const config = yield* fromEnv({
        schoolName: "IGS Lilienthal",
        schoolLoginName: "igs-lilienthal",
        serverUrl: "https://igs-lilienthal.webuntis.com/WebUntis/?school=igs-lilienthal",
        username: "tester",
        password: "secret"
      });

      expect(config.server).toBeUndefined();
      expect(config.serverUrl).toContain("igs-lilienthal.webuntis.com");
      expect(config.schoolLoginName).toBe("igs-lilienthal");
    }));

  it.effect("returns a typed configuration error for missing required env vars", () =>
    Effect.gen(function*() {
      const error = yield* Effect.flip(fromEnv({}));

      expect(error).toBeInstanceOf(ConfigurationError);
    }));
});
