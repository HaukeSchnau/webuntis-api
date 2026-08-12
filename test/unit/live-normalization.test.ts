import { describe, expect, it } from "@effect/vitest";
import {
  normalizeMessageRecipientQuickfilters,
  normalizeSnapshotValue,
  summarizeSnapshotCollection,
} from "../live/support.ts";

describe("live snapshot normalization", () => {
  it("marks volatile recipient counts as dynamic", () => {
    expect(
      normalizeMessageRecipientQuickfilters({
        canCreatePublic: false,
        items: [
          {
            id: 3,
            name: "Staff",
            personCount: 134,
            deletable: false,
            editable: false,
            publicAccess: true,
            dynamic: false,
          },
        ],
      }),
    ).toEqual({
      canCreatePublic: false,
      items: [
        {
          id: 3,
          name: "Staff",
          personCount: "<dynamic-count>",
          deletable: false,
          editable: false,
          publicAccess: true,
          dynamic: false,
        },
      ],
    });
  });

  it("preserves stable contract vocabulary while classifying unstable values", () => {
    expect(
      normalizeSnapshotValue({
        role: "ADMIN",
        roles: ["TEACHER"],
        views: ["TIMETABLE_OVERVIEW"],
        recipientOptions: ["STAFF", "STUDENTS"],
        resourceType: "CLASS",
        type: "DEPARTMENT",
        errorCode: "ACCESS_DENIED",
        requestId: "cafebabe",
        traceId: "deadbeef",
        username: "alice",
        greetingName: "Alice Example",
        accessToken: "secret",
        email: "alice@example.com",
        updatedAt: "2026-08-12T12:34:56Z",
        validOn: "2026-08-12",
        wuVersion: "2026.8.1",
      }),
    ).toEqual({
      role: "ADMIN",
      roles: ["TEACHER"],
      views: ["TIMETABLE_OVERVIEW"],
      recipientOptions: ["STAFF", "STUDENTS"],
      resourceType: "CLASS",
      type: "DEPARTMENT",
      errorCode: "ACCESS_DENIED",
      requestId: "<dynamic-id>",
      traceId: "<dynamic-id>",
      username: "<personal-username>",
      greetingName: "<personal-name>",
      accessToken: "<secret>",
      email: "<personal-email>",
      updatedAt: "<dynamic-datetime>",
      validOn: "<dynamic-date>",
      wuVersion: "<dynamic-version>",
    });
  });

  it("summarizes collections without hiding their original size", () => {
    expect(summarizeSnapshotCollection(["one", "two", "three"], 2)).toEqual({
      itemCount: "<dynamic-count>",
      items: ["one", "two"],
      summary: "<representative-items>",
    });
  });
});
