import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import { strictJsonParseOptions } from "../src/core/schema.ts";
import {
  AppPlatformApplicationMenuSchema,
  HomeCellSchema,
  MessageSummarySchema,
  MessagesPermissionsSchema,
  OnboardingSchema,
  StartupActionsSchema,
  TimeGridSchema,
  TimetableFormatDefinitionSchema,
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

  it("rejects unsupported onboarding types", () => {
    const decode = Schema.decodeUnknownSync(OnboardingSchema);

    expect(() =>
      decode({
        type: "OTHER",
        time: "2026-03-14T12:00:00",
        step: "timetable--date-picker"
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

  it("rejects unsupported home cell types", () => {
    const decode = Schema.decodeUnknownSync(HomeCellSchema);

    expect(() =>
      decode({
        badge: null,
        type: "UNKNOWN_CELL"
      }, strictJsonParseOptions)
    ).toThrow();
  });

  it("rejects unsupported message recipient options", () => {
    const decode = Schema.decodeUnknownSync(MessagesPermissionsSchema);

    expect(() =>
      decode({
        recipientOptions: ["STAFF", "GUARDIANS"],
        allowRequestReadConfirmation: true,
        recipientSearchMaxResult: 25,
        showDraftsTab: true,
        showSentTab: true,
        canForbidReplies: true,
        maxFileSize: 10,
        maxFileCount: 3
      }, strictJsonParseOptions)
    ).toThrow();
  });

  it("rejects unsupported time grid types", () => {
    const decode = Schema.decodeUnknownSync(TimetableFormatDefinitionSchema);

    expect(() =>
      decode({
        id: 2,
        name: "Default",
        longname: "Default",
        showStartEndTimeOfSlots: true,
        showStartEndTime: true,
        showCancellations: true,
        showExternalCalendars: false,
        hideDetails: false,
        minRows: 6,
        duration: {
          start: "08:00",
          end: "13:00"
        },
        timeGridType: "CUSTOM_GRID",
        timeGridDays: ["MONDAY"],
        timeGridSlots: [
          {
            name: "1",
            number: 1,
            duration: {
              start: "08:00",
              end: "08:45"
            }
          }
        ]
      }, strictJsonParseOptions)
    ).toThrow();
  });

  it("rejects unsupported startup actions", () => {
    const decode = Schema.decodeUnknownSync(StartupActionsSchema);

    expect(() =>
      decode({
        startupActions: ["VERIFY_PROFILE_DATA", "UNKNOWN_ACTION"]
      }, strictJsonParseOptions)
    ).toThrow();
  });
});
