import { readFileSync } from "node:fs";
import { Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";

const EndpointCatalogSchema = Schema.Struct({
  observedAt: Schema.String,
  tenantHost: Schema.String,
  sourceBundle: Schema.String,
  endpointCount: Schema.Int,
  versionCounts: Schema.Record(Schema.String, Schema.Int),
  endpoints: Schema.Array(Schema.String),
});

const endpointCatalog = Schema.decodeUnknownSync(EndpointCatalogSchema)(
  JSON.parse(
    readFileSync(
      new URL("../../docs/research/webuntis/modern-rest-endpoints.json", import.meta.url),
      "utf8",
    ),
  ),
);

const runtimeRouteMap = readFileSync(
  new URL("../../docs/research/webuntis/runtime-route-map.md", import.meta.url),
  "utf8",
);

const groupByFamily = (endpoints: ReadonlyArray<string>) =>
  Object.fromEntries(
    Object.entries(
      endpoints.reduce<Record<string, number>>((acc, endpoint) => {
        const [, , , version, family = "root"] = endpoint.split("/");
        const key = `${version}:${family}`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort(([left], [right]) => left.localeCompare(right)),
  );

describe("reverse-engineering artifacts", () => {
  it("keeps the mined REST endpoint catalog stable", () => {
    expect(endpointCatalog.endpointCount).toBe(endpointCatalog.endpoints.length);
    expect({
      observedAt: endpointCatalog.observedAt,
      tenantHost: endpointCatalog.tenantHost,
      sourceBundle: endpointCatalog.sourceBundle,
      versionCounts: endpointCatalog.versionCounts,
      familyCounts: groupByFamily(endpointCatalog.endpoints),
      endpoints: endpointCatalog.endpoints,
    }).toMatchSnapshot();
  });

  it("keeps the runtime route map stable", () => {
    expect(runtimeRouteMap).toMatchSnapshot();
  });
});
