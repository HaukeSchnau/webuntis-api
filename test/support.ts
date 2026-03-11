import { Redacted } from "effect";
import type {
  AppData,
  MessagesPermissions,
  MessagesStatus,
  SessionStatus,
  TimetableEntries,
  TimetableEntriesSettings,
  TimetableFilter,
  TimetableGrid,
  TimetableMenu,
  TimetableSearch,
  UserContactData,
  UserEmail
} from "../src/domains/schemas.ts";
import { UnexpectedResponseError } from "../src/core/errors.ts";
import { fromEnv } from "../src/core/config.ts";

export const readLiveConfig = () => fromEnv();

export const liveEnvMissing = [
  process.env.WEBUNTIS_SCHOOL_NAME ? undefined : "WEBUNTIS_SCHOOL_NAME",
  process.env.WEBUNTIS_USERNAME ? undefined : "WEBUNTIS_USERNAME",
  process.env.WEBUNTIS_PASSWORD ? undefined : "WEBUNTIS_PASSWORD"
].filter((field): field is string => field !== undefined);

const redactString = (value: string) =>
  value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "<redacted-email>")
    .replace(/[A-Z][A-ZÄÖÜ-]{1,}/g, "<redacted-label>");

const normalizeUnknown = (value: unknown): unknown => {
  if (typeof value === "string") {
    return redactString(value);
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean" || value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(normalizeUnknown);
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        if (["requestId", "traceId", "token", "Authorization"].includes(key)) {
          return [key, "<redacted>"];
        }
        return [key, normalizeUnknown(entry)];
      })
    );
  }
  return value;
};

export const normalizeAppData = (value: AppData) => normalizeUnknown(value);
export const normalizeMessagesPermissions = (value: MessagesPermissions) => normalizeUnknown(value);
export const normalizeMessagesStatus = (value: MessagesStatus) => normalizeUnknown(value);
export const normalizeUserContactData = (value: UserContactData) => normalizeUnknown(value);
export const normalizeUserEmail = (value: UserEmail) => normalizeUnknown(value);
export const normalizeSessionStatus = (value: SessionStatus) => normalizeUnknown(value);
export const normalizeTimetableGrid = (value: TimetableGrid) => normalizeUnknown(value);
export const normalizeTimetableFilter = (value: TimetableFilter) => normalizeUnknown(value);
export const normalizeTimetableEntriesSettings = (value: TimetableEntriesSettings) => normalizeUnknown(value);
export const normalizeTimetableEntries = (value: TimetableEntries) => normalizeUnknown(value);
export const normalizeTimetableMenu = (value: TimetableMenu) => normalizeUnknown(value);
export const normalizeTimetableSearch = (value: TimetableSearch) => normalizeUnknown(value);

export const normalizeUnexpectedResponse = (error: UnexpectedResponseError) => {
  let body: unknown = error.body;
  try {
    body = JSON.parse(error.body);
  } catch {
    body = error.body;
  }

  return {
    path: error.path,
    status: error.status,
    body: normalizeUnknown(body)
  };
};
