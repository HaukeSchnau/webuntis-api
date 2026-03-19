import { Effect, Layer, Schema, ServiceMap } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import type { ClientConfig } from "./config.ts";
import { ClientConfig as ClientConfigTag } from "./config.ts";
import { decodeError, DiscoveryError, httpClientErrorToTransportError, type TransportError } from "./errors.ts";
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
  readonly search: (query: string) => Effect.Effect<ReadonlyArray<ResolvedSchool>, DiscoveryError | TransportError | ReturnType<typeof decodeError>>;
  readonly resolve: (query: string) => Effect.Effect<ResolvedSchool, DiscoveryError | TransportError | ReturnType<typeof decodeError>>;
}

export const SchoolDiscovery = ServiceMap.Service<SchoolDiscovery, SchoolDiscovery>("webuntis/SchoolDiscovery");

export const makeSchoolDiscovery = Effect.gen(function*() {
  const client = yield* HttpClient.HttpClient;
  const config = yield* ClientConfigTag;

  const search = (query: string) =>
    HttpClientRequest.post(config.discoveryEndpoint ?? "https://schoolsearch.webuntis.com/schoolquery2").pipe(
      HttpClientRequest.acceptJson,
      HttpClientRequest.bodyJson(searchPayload(query)),
      Effect.flatMap(client.execute),
      Effect.mapError((error) => httpClientErrorToTransportError("POST", "/schoolquery2", error)),
      Effect.flatMap((response) =>
        HttpClientResponse.filterStatusOk(response).pipe(
          Effect.mapError(() =>
            new DiscoveryError({
              query,
              message: `School search failed for ${JSON.stringify(query)}`
            }))
        )),
      Effect.flatMap(HttpClientResponse.schemaBodyJson(SearchSchoolRpcResponseSchema, strictJsonParseOptions)),
      Effect.mapError((error) =>
        error instanceof DiscoveryError || (typeof error === "object" && error !== null && "_tag" in error && error._tag === "TransportError")
          ? error
          : decodeError("/schoolquery2", error)),
      Effect.map((decoded) =>
        decoded.result.schools.map((school) => ({
          displayName: school.displayName,
          loginName: school.loginName,
          server: school.server,
          serverUrl: school.serverUrl,
          schoolId: school.schoolId,
          tenantId: school.tenantId
        }) satisfies ResolvedSchool))
    );

  const resolve = (query: string) =>
    search(query).pipe(
      Effect.flatMap((schools) =>
        schools.length > 0
          ? Effect.succeed(
            schools.find((school) => school.displayName.toLowerCase() === query.toLowerCase()) ?? schools[0]!
          )
          : Effect.fail(
            new DiscoveryError({
              query,
              message: `No WebUntis tenant matched ${JSON.stringify(query)}`
            })
          ))
    );

  return {
    search,
    resolve
  } satisfies SchoolDiscovery;
});

export const Live = Layer.effect(SchoolDiscovery, makeSchoolDiscovery);
