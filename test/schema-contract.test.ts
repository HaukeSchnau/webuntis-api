import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import { strictJsonParseOptions } from "../src/core/schema.ts";
import {
  AppPlatformApplicationMenuSchema,
  MessageSummarySchema,
  TimeGridSchema,
  TimetableEntriesWeekOverviewSchema
} from "../src/domains/schemas.ts";

describe("strict schema decoding", () => {
  it("rejects excess properties in existing message payloads", () => {
    const decode = Schema.decodeUnknownSync(MessageSummarySchema);

    expect(() =>
      decode({
        id: 1,
        subject: "Subject",
        contentPreview: null,
        sender: {
          className: null,
          displayName: "Teacher",
          imageUrl: null,
          userId: 2,
          extra: true
        },
        sentDateTime: "2026-03-14T12:00:00",
        allowMessageDeletion: false,
        hasAttachments: false,
        isMessageRead: true,
        isReply: false,
        isReplyAllowed: true
      }, strictJsonParseOptions)
    ).toThrow();
  });

  it("rejects excess properties in existing timetable payloads", () => {
    const decode = Schema.decodeUnknownSync(TimeGridSchema);

    expect(() =>
      decode({
        schoolyearId: 7,
        units: [
          {
            unitOfDay: 1,
            startTime: 740,
            endTime: 800,
            extra: true
          }
        ]
      }, strictJsonParseOptions)
    ).toThrow();
  });

  it("rejects excess properties in new app bootstrap payloads", () => {
    const decode = Schema.decodeUnknownSync(AppPlatformApplicationMenuSchema);

    expect(() =>
      decode({
        icon: "icon.svg",
        id: 7,
        logoutUrl: null,
        name: "IServ",
        openInNewTab: true,
        redirectUrl: "https://example.invalid",
        extra: true
      }, strictJsonParseOptions)
    ).toThrow();
  });

  it("rejects excess properties in new overview payloads", () => {
    const decode = Schema.decodeUnknownSync(TimetableEntriesWeekOverviewSchema);

    expect(() =>
      decode({
        slots: [
          {
            name: "Block1-1",
            number: 1,
            duration: {
              start: "08:00",
              end: "08:40"
            }
          }
        ],
        days: [
          {
            day: "2026-03-16",
            resources: [
              {
                resource: {
                  id: 557,
                  shortName: "1.12",
                  longName: "Grasberg",
                  displayName: ""
                },
                status: "NO_DATA",
                cells: [
                  {
                    backEntries: [],
                    gridEntries: [],
                    extra: true
                  }
                ]
              }
            ]
          }
        ]
      }, strictJsonParseOptions)
    ).toThrow();
  });
});
