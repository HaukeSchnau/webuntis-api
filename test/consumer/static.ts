import { Effect } from "effect";
import {
  ClientConfig,
  InvalidRequestError,
  WebUntisClient,
  makeWebUntisLayer,
  webUntisLayer,
  type ExamDateRangeRequest,
  type MessageSummary,
  type TimetableEntriesRequest,
  type WebUntisClientConfig,
} from "@schnau/webuntis-api";
import { HomeSchema } from "@schnau/webuntis-api/schemas";

const request: ExamDateRangeRequest = {
  start: "2026-01-01",
  end: "2026-01-31",
};

const resource: TimetableEntriesRequest["resource"] = 1;
// Element types of collection responses must be nameable from the root entry.
const summarySubject = (message: MessageSummary) => message.subject;
// @ts-expect-error A date range must provide both boundaries.
const invalidRange: ExamDateRangeRequest = { start: "2026-01-01" };
// @ts-expect-error WebUntis accepts exactly one resource per timetable entries request.
const invalidResources: TimetableEntriesRequest["resource"] = [1, 2];

const config: WebUntisClientConfig = await Effect.runPromise(
  ClientConfig.fromEnv({
    schoolName: "Consumer fixture",
    username: "fixture",
    password: "fixture",
    serverUrl: "https://example.webuntis.com/WebUntis/",
  }),
);

const layer = makeWebUntisLayer(config);
const program = Effect.gen(function* () {
  const client = yield* WebUntisClient;
  return yield* client.exams.list(request);
});

void summarySubject;
void webUntisLayer;
void HomeSchema;
void InvalidRequestError;
void layer;
void program;
void resource;
void invalidRange;
void invalidResources;
