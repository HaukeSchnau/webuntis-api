import { Effect, Layer, Redacted, Schema, ServiceMap } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import type { ClientConfig } from "./config.ts";
import { ClientConfig as ClientConfigTag } from "./config.ts";
import { SchoolSearchError, SchemaDriftError } from "./errors.ts";
import { strictJsonParseOptions } from "./schema.ts";
import type { ResolvedSchool } from "./types.ts";

const SchoolSearchResultSchema = Schema.Struct({
  server: Schema.String,
  address: Schema.String,
  displayName: Schema.String,
  loginName: Schema.String,
  schoolId: Schema.Number,
  serverUrl: Schema.String,
  tenantId: Schema.String
});

const SearchSchoolRpcResponseSchema = Schema.Struct({
  result: Schema.Struct({
    schools: Schema.Array(SchoolSearchResultSchema)
  }),
  id: Schema.String,
  jsonrpc: Schema.Literal("2.0")
});

const searchPayload = (query: string) => ({
  id: `wu_schulsuche-${Date.now()}`,
  method: "searchSchool",
  params: [{ search: query.toLowerCase() }],
  jsonrpc: "2.0" as const
});

export interface SchoolDiscovery {
  readonly search: (query: string) => Effect.Effect<ReadonlyArray<ResolvedSchool>, unknown>;
  readonly resolve: (query: string) => Effect.Effect<ResolvedSchool, unknown>;
}

export const SchoolDiscovery = ServiceMap.Service<SchoolDiscovery, SchoolDiscovery>("webuntis/SchoolDiscovery");

export const Live = Layer.effect(SchoolDiscovery)(
  Effect.gen(function*() {
    const client = yield* HttpClient.HttpClient;
    const config = yield* ClientConfigTag;

    const search = (query: string) =>
      Effect.gen(function*() {
        const request = yield* HttpClientRequest.post(
          config.discoveryEndpoint ?? "https://schoolsearch.webuntis.com/schoolquery2"
        ).pipe(
          HttpClientRequest.acceptJson,
          HttpClientRequest.bodyJson(searchPayload(query))
        );

        const response = yield* client.execute(request).pipe(
          Effect.flatMap(HttpClientResponse.filterStatusOk),
          Effect.mapError((error) =>
            new SchoolSearchError({
              query,
              message: String(error)
            }))
        );

        const decoded = yield* HttpClientResponse.schemaBodyJson(
          SearchSchoolRpcResponseSchema,
          strictJsonParseOptions
        )(response).pipe(
          Effect.mapError((error) =>
            new SchemaDriftError({
              path: "/schoolquery2",
              message: String(error)
            }))
        );

        return decoded.result.schools.map((school) => ({
          displayName: school.displayName,
          loginName: school.loginName,
          server: school.server,
          serverUrl: school.serverUrl,
          schoolId: school.schoolId,
          tenantId: school.tenantId
        }) satisfies ResolvedSchool);
      });

    const resolve = (query: string) =>
      search(query).pipe(
        Effect.flatMap((schools) =>
          schools.length > 0
            ? Effect.succeed(
              schools.find((school) => school.displayName.toLowerCase() === query.toLowerCase()) ?? schools[0]!
            )
            : Effect.fail(
              new SchoolSearchError({
                query,
                message: `No WebUntis tenant matched ${JSON.stringify(query)}`
              })
            ))
      );

    return {
      search,
      resolve
    };
  })
);
