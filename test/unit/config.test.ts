import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { ClientConfig } from "../../src/internal/config.ts";
import { ConfigurationError } from "../../src/internal/errors.ts";

describe("config loading", () => {
  it.effect("accepts direct serverUrl overrides without WEBUNTIS_SERVER", () =>
    Effect.gen(function* () {
      const config = yield* ClientConfig.fromEnv({
        schoolName: "IGS Lilienthal",
        schoolLoginName: "igs-lilienthal",
        serverUrl: "https://igs-lilienthal.webuntis.com/WebUntis/?school=igs-lilienthal",
        username: "tester",
        password: "secret",
      });

      expect(config.server).toBeUndefined();
      expect(config.serverUrl).toContain("igs-lilienthal.webuntis.com");
      expect(config.schoolLoginName).toBe("igs-lilienthal");
    }),
  );

  it.effect("returns a typed configuration error for missing required env vars", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(ClientConfig.fromEnv({}));

      expect(error).toBeInstanceOf(ConfigurationError);
    }),
  );

  it.effect("rejects invalid serverUrl values as configuration errors", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        ClientConfig.fromEnv({
          schoolName: "IGS Lilienthal",
          schoolLoginName: "igs-lilienthal",
          serverUrl: "not-a-url",
          username: "tester",
          password: "secret",
        }),
      );

      expect(error).toBeInstanceOf(ConfigurationError);
    }),
  );

  it.effect("rejects non-HTTP URL schemes", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        ClientConfig.fromEnv({
          schoolName: "IGS Lilienthal",
          schoolLoginName: "igs-lilienthal",
          serverUrl: "file:///tmp/webuntis",
          username: "tester",
          password: "secret",
        }),
      );

      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.message).toContain("HTTP(S)");
    }),
  );
});
