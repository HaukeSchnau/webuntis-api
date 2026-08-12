import { describe, expect, it } from "@effect/vitest";
import { normalizeMessageRecipientQuickfilters } from "../live/support.ts";

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
});
