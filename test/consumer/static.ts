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
} from "webuntis-api";
import { HomeSchema } from "webuntis-api/schemas";

const request: ExamDateRangeRequest = {
  start: "2026-01-01",
  end: "2026-01-31",
};

const resources: TimetableEntriesRequest["resources"] = [1];
// Element types of collection responses must be nameable from the root entry.
const summarySubject = (message: MessageSummary) => message.subject;
// @ts-expect-error A date range must provide both boundaries.
const invalidRange: ExamDateRangeRequest = { start: "2026-01-01" };
// @ts-expect-error Timetable entry reads require at least one resource.
const invalidResources: TimetableEntriesRequest["resources"] = [];

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
void resources;
void invalidRange;
void invalidResources;
