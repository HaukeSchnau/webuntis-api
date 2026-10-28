import { describe, expect, expectTypeOf, it } from "@effect/vitest";
import { Context, type Effect } from "effect";
import { withSchoolYear } from "../../src/index.ts";
import { resolveBaseUrl } from "../../src/internal/url.ts";

class TestDependency extends Context.Service<TestDependency, { readonly value: number }>()(
  "test/TestDependency",
) {}

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
      ].map((serverUrl) => resolveBaseUrl({ serverUrl })),
    ).toEqual(Array.from({ length: 6 }, () => "https://igs-lilienthal.webuntis.com/WebUntis"));
  });

  it("rejects values that cannot address a WebUntis server", () => {
    expect(
      ["file:///tmp/webuntis", "https://", "not a url", "ftp://igs-lilienthal.webuntis.com"].map(
        (serverUrl) => resolveBaseUrl({ serverUrl }),
      ),
    ).toEqual([undefined, undefined, undefined, undefined]);
  });
});

describe("school-year scope types", () => {
  it("preserves an effect's success, error, and requirement channels", () => {
    // Type-level assertion only; the value is never run.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const original = undefined as unknown as Effect.Effect<number, "failure", TestDependency>;
    const scoped = withSchoolYear(7)(original);

    expectTypeOf(scoped).toEqualTypeOf<typeof original>();
  });
});
