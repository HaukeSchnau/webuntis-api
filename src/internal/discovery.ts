import { Clock, Effect, Schema } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http";
import { type School, SchoolSchema } from "../domains/schools/schema.ts";
import {
  type DecodeError,
  DiscoveryError,
  decodeError,
  httpClientErrorToTransportError,
  type TransportError,
} from "./errors.ts";
import { runtimeJsonParseOptions } from "./schema.ts";

const schoolSearchEndpoint = "https://schoolsearch.webuntis.com/schoolquery2";

const SearchSchoolRpcResponseSchema = Schema.Struct({
  result: Schema.Struct({
    size: Schema.optional(Schema.Int),
    schools: Schema.Array(SchoolSchema),
  }),
  id: Schema.String,
  jsonrpc: Schema.Literal("2.0"),
});

const searchPayload = (query: string, now: number) => ({
  id: `wu_schulsuche-${now}`,
  method: "searchSchool",
  params: [{ search: query.toLowerCase() }],
  jsonrpc: "2.0" as const,
});

/**
 * Searches WebUntis' public school directory. Needs no account; any result can
 * be passed as the `school` of a connection.
 */
export const searchSchools = (
  query: string,
): Effect.Effect<
  ReadonlyArray<School>,
  DiscoveryError | TransportError | DecodeError,
  HttpClient.HttpClient
> =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const now = yield* Clock.currentTimeMillis;
    const response = yield* HttpClientRequest.post(schoolSearchEndpoint).pipe(
      HttpClientRequest.acceptJson,
      HttpClientRequest.bodyJson(searchPayload(query, now)),
      Effect.flatMap(client.execute),
      Effect.mapError((error) => httpClientErrorToTransportError("POST", "/schoolquery2", error)),
    );
    const ok = yield* HttpClientResponse.filterStatusOk(response).pipe(
      Effect.mapError(
        (cause) =>
          new DiscoveryError({
            query,
            message: `School search failed for ${JSON.stringify(query)}`,
            cause,
          }),
      ),
    );
    const decoded = yield* HttpClientResponse.schemaBodyJson(
      SearchSchoolRpcResponseSchema,
      runtimeJsonParseOptions,
    )(ok).pipe(Effect.mapError((error) => decodeError("/schoolquery2", error)));
    return decoded.result.schools;
  }).pipe(Effect.withSpan("searchSchools"));

/** The sole element of `candidates`, or `undefined` if there is not exactly one. */
const onlyMatch = (candidates: ReadonlyArray<School>): School | undefined =>
  candidates.length === 1 ? candidates[0] : undefined;

/**
 * Resolves a school name to exactly one school. An exact match on display
 * name, login name, server, or server URL wins; otherwise the search must
 * return a single result.
 */
export const findSchool = (query: string) =>
  searchSchools(query).pipe(
    Effect.flatMap((schools) => {
      const normalizedQuery = query.trim().toLowerCase();
      const exactMatches = schools.filter(
        (school) =>
          school.displayName.toLowerCase() === normalizedQuery ||
          school.loginName.toLowerCase() === normalizedQuery ||
          school.server.toLowerCase() === normalizedQuery ||
          school.serverUrl.toLowerCase() === normalizedQuery,
      );

      const exactMatch = onlyMatch(exactMatches);
      if (exactMatch !== undefined) {
        return Effect.succeed(exactMatch);
      }

      if (exactMatches.length > 1) {
        return Effect.fail(
          new DiscoveryError({
            query,
            message: `Multiple WebUntis tenants matched ${JSON.stringify(query)} exactly`,
            matches: exactMatches.map((school) => school.serverUrl),
          }),
        );
      }

      if (schools.length === 0) {
        return Effect.fail(
          new DiscoveryError({
            query,
            message: `No WebUntis tenant matched ${JSON.stringify(query)}`,
          }),
        );
      }

      const soleMatch = onlyMatch(schools);
      if (soleMatch !== undefined) {
        return Effect.succeed(soleMatch);
      }

      return Effect.fail(
        new DiscoveryError({
          query,
          message: `School discovery for ${JSON.stringify(query)} was ambiguous; pass the chosen school from searchSchools instead of its name`,
          matches: schools.map((school) => `${school.displayName} <${school.serverUrl}>`),
        }),
      );
    }),
  );
