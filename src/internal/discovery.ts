import { Context, Effect, Layer, Schema } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import { ClientConfig } from "./config.ts";
import {
  type DecodeError,
  DiscoveryError,
  decodeError,
  httpClientErrorToTransportError,
  type TransportError,
} from "./errors.ts";
import { strictJsonParseOptions } from "./schema.ts";
import type { ResolvedSchool } from "./types.ts";

const SchoolSearchResultSchema = Schema.Struct({
  server: Schema.String,
  address: Schema.String,
  displayName: Schema.String,
  loginName: Schema.String,
  schoolId: Schema.Number,
  serverUrl: Schema.String,
  tenantId: Schema.String,
});

const SearchSchoolRpcResponseSchema = Schema.Struct({
  result: Schema.Struct({
    schools: Schema.Array(SchoolSearchResultSchema),
  }),
  id: Schema.String,
  jsonrpc: Schema.Literal("2.0"),
});

const searchPayload = (query: string) => ({
  id: `wu_schulsuche-${Date.now()}`,
  method: "searchSchool",
  params: [{ search: query.toLowerCase() }],
  jsonrpc: "2.0" as const,
});

export interface SchoolDiscoveryShape {
  readonly search: (
    query: string,
  ) => Effect.Effect<
    ReadonlyArray<ResolvedSchool>,
    DiscoveryError | TransportError | DecodeError
  >;
  readonly resolve: (
    query: string,
  ) => Effect.Effect<
    ResolvedSchool,
    DiscoveryError | TransportError | DecodeError
  >;
}

export class SchoolDiscovery extends Context.Service<
  SchoolDiscovery,
  SchoolDiscoveryShape
>()("webuntis/internal/SchoolDiscovery") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const config = yield* ClientConfig;

      const search: SchoolDiscoveryShape["search"] = (query) =>
        HttpClientRequest.post(
          config.discoveryEndpoint ??
            "https://schoolsearch.webuntis.com/schoolquery2",
        ).pipe(
          HttpClientRequest.acceptJson,
          HttpClientRequest.bodyJson(searchPayload(query)),
          Effect.flatMap(client.execute),
          Effect.mapError((error) =>
            httpClientErrorToTransportError("POST", "/schoolquery2", error),
          ),
          Effect.flatMap((response) =>
            HttpClientResponse.filterStatusOk(response).pipe(
              Effect.mapError(
                (error) =>
                  new DiscoveryError({
                    query,
                    message: `School search failed for ${JSON.stringify(query)}`,
                    cause: error,
                  }),
              ),
            ),
          ),
          Effect.flatMap(
            HttpClientResponse.schemaBodyJson(
              SearchSchoolRpcResponseSchema,
              strictJsonParseOptions,
            ),
          ),
          Effect.mapError((error) =>
            error instanceof DiscoveryError ||
            (typeof error === "object" &&
              error !== null &&
              "_tag" in error &&
              error._tag === "TransportError")
              ? error
              : decodeError("/schoolquery2", error),
          ),
          Effect.map((decoded) =>
            decoded.result.schools.map(
              (school) =>
                ({
                  displayName: school.displayName,
                  loginName: school.loginName,
                  server: school.server,
                  serverUrl: school.serverUrl,
                  schoolId: school.schoolId,
                  tenantId: school.tenantId,
                }) satisfies ResolvedSchool,
            ),
          ),
        );

      const resolve: SchoolDiscoveryShape["resolve"] = (query) =>
        search(query).pipe(
          Effect.flatMap((schools) => {
            const normalizedQuery = query.trim().toLowerCase();
            const exactMatches = schools.filter(
              (school) =>
                school.displayName.toLowerCase() === normalizedQuery ||
                school.loginName.toLowerCase() === normalizedQuery ||
                school.server.toLowerCase() === normalizedQuery ||
                school.serverUrl.toLowerCase() === normalizedQuery,
            );

            if (exactMatches.length === 1) {
              const match = exactMatches[0];
              if (match !== undefined) {
                return Effect.succeed(match);
              }
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

            if (schools.length === 1) {
              const match = schools[0];
              if (match !== undefined) {
                return Effect.succeed(match);
              }
            }

            return Effect.fail(
              new DiscoveryError({
                query,
                message: `School discovery for ${JSON.stringify(query)} was ambiguous; provide WEBUNTIS_SCHOOL_LOGIN_NAME and server details`,
                matches: schools.map(
                  (school) => `${school.displayName} <${school.serverUrl}>`,
                ),
              }),
            );
          }),
        );

      return SchoolDiscovery.of({
        search,
        resolve,
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}
