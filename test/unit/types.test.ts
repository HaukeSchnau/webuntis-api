import { describe, expect, expectTypeOf, it } from "@effect/vitest";
import { Context, type Effect } from "effect";
import { withSchoolYear } from "../../src/index.ts";
import { type ResolvedSchool, resolveBaseUrl } from "../../src/internal/types.ts";

class TestDependency extends Context.Service<TestDependency, { readonly value: number }>()(
  "test/TestDependency",
) {}

const makeSchool = (serverUrl: string): ResolvedSchool => ({
  displayName: "IGS Lilienthal",
  loginName: "igs-lilienthal",
  server: "igs-lilienthal.webuntis.com",
  serverUrl,
  schoolId: 1,
});

describe("internal URL normalization", () => {
  it("normalizes supported WebUntis base URL shapes", () => {
    expect(
      [
        "https://igs-lilienthal.webuntis.com",
        "https://igs-lilienthal.webuntis.com/WebUntis",
        "https://igs-lilienthal.webuntis.com/WebUntis/",
        "https://igs-lilienthal.webuntis.com/WebUntis/?school=igs-lilienthal",
        "https://igs-lilienthal.webuntis.com/WebUntis/index.do?school=igs-lilienthal",
        "igs-lilienthal.webuntis.com",
      ].map((serverUrl) => resolveBaseUrl(makeSchool(serverUrl))),
    ).toEqual(Array.from({ length: 6 }, () => "https://igs-lilienthal.webuntis.com/WebUntis"));
  });
});

describe("school-year scope types", () => {
  it("preserves an effect's success, error, and requirement channels", () => {
    const original = undefined as unknown as Effect.Effect<number, "failure", TestDependency>;
    const scoped = withSchoolYear(7)(original);

    expectTypeOf(scoped).toEqualTypeOf<typeof original>();
  });
});
