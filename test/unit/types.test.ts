import { describe, expect, it } from "@effect/vitest";
import {
  type ResolvedSchool,
  resolveBaseUrl,
} from "../../src/internal/types.ts";

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
    ).toEqual(
      Array.from(
        { length: 6 },
        () => "https://igs-lilienthal.webuntis.com/WebUntis",
      ),
    );
  });
});
