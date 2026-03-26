import { Layer } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import type * as HttpClient from "effect/unstable/http/HttpClient";
import { ClientConfig } from "./config.ts";
import { SchoolDiscovery } from "./discovery.ts";
import { WebUntisHttp } from "./http.ts";
import { MetadataState } from "./metadata-state.ts";
import { RawViewApiClient } from "./raw-view-api.ts";
import { SchoolResolver } from "./school-resolver.ts";
import { SessionState } from "./session-state.ts";

export interface WebUntisRuntimeOptions {
  readonly config: ClientConfig["Service"];
  readonly transportLayer?: Layer.Layer<HttpClient.HttpClient>;
}

export const makeWebUntisCoreLayer = ({
  config,
  transportLayer = FetchHttpClient.layer,
}: WebUntisRuntimeOptions) => {
  const baseLayer = Layer.mergeAll(ClientConfig.layer(config), transportLayer);
  const discoveryLayer = SchoolDiscovery.layerNoDeps.pipe(
    Layer.provideMerge(baseLayer),
  );
  const schoolResolverLayer = SchoolResolver.layerNoDeps.pipe(
    Layer.provideMerge(discoveryLayer),
  );
  const sessionLayer = SessionState.layerNoDeps.pipe(
    Layer.provideMerge(schoolResolverLayer),
  );
  const metadataLayer = MetadataState.layerNoDeps.pipe(
    Layer.provideMerge(sessionLayer),
  );
  const httpLayer = WebUntisHttp.layerNoDeps.pipe(
    Layer.provideMerge(metadataLayer),
  );
  return RawViewApiClient.layerNoDeps.pipe(Layer.provideMerge(httpLayer));
};

export const makeWebUntisRuntimeLayer = makeWebUntisCoreLayer;
