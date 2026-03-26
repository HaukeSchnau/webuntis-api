import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface EndpointCatalog {
  readonly observedAt: string;
  readonly tenantHost: string;
  readonly sourceBundle: string;
  readonly endpointCount: number;
  readonly versionCounts: Readonly<Record<string, number>>;
  readonly endpoints: ReadonlyArray<string>;
}

const endpointCatalog = JSON.parse(
  readFileSync(
    new URL(
      "../../docs/research/webuntis/modern-rest-endpoints.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as EndpointCatalog;

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
    expect(endpointCatalog.endpointCount).toBe(
      endpointCatalog.endpoints.length,
    );
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
