import { Effect, Layer, LayerMap, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import {
  Credential,
  InvalidRequestError,
  SchoolyearsClient,
  WebUntisClient,
  WebUntisConnection,
  searchSchools,
  webUntisLayer,
  type ExamDateRangeRequest,
  type MessageSummary,
  type School,
  type SchoolTarget,
  type TimetableEntriesForResource,
  type TimetableEntriesRequest,
  TimetableClient,
} from "@schnau/webuntis-api";
import { HomeSchema, SchoolSchema } from "@schnau/webuntis-api/schemas";

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
// A search result is a valid school target.
const asTarget = (school: School): SchoolTarget => school;

const layer = webUntisLayer({
  school: { loginName: "fixture", serverUrl: "https://example.webuntis.com/WebUntis/" },
  credential: Credential.Password({ username: "fixture", password: Redacted.make("fixture") }),
}).pipe(Layer.provide(FetchHttpClient.layer));
const fromEnv = Layer.unwrap(Effect.map(WebUntisConnection.fromEnv, webUntisLayer));
const search = searchSchools("fixture").pipe(Effect.provide(FetchHttpClient.layer));
// The multi-school pattern the README documents.
class Schools extends LayerMap.Service<Schools>()("Schools", {
  lookup: (loginName: string) =>
    webUntisLayer({
      school: { loginName, serverUrl: "https://example.webuntis.com" },
      credential: Credential.Password({ username: "fixture", password: Redacted.make("fixture") }),
    }),
  dependencies: [FetchHttpClient.layer],
  idleTimeToLive: "10 minutes",
}) {}
const years = SchoolyearsClient.use((client) => client.list).pipe(
  Effect.provide(Schools.get("fixture")),
  Effect.provide(Schools.layer),
);
const batch = TimetableClient.use((timetable) =>
  timetable.getEntriesForResources(
    { start: "2026-01-05", end: "2026-01-09", resourceType: "CLASS", resources: [1, 2] },
    { concurrency: 4, raw: true },
  ),
).pipe(Effect.map((results): ReadonlyArray<TimetableEntriesForResource> => results));
const program = Effect.gen(function* () {
  const client = yield* WebUntisClient;
  return yield* client.exams.list(request);
});

void summarySubject;
void HomeSchema;
void SchoolSchema;
void InvalidRequestError;
void asTarget;
void layer;
void fromEnv;
void search;
void program;
void years;
void batch;
void resource;
void invalidRange;
void invalidResources;
