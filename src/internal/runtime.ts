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

export const makeWebUntisRuntimeLayer = ({
  config,
  transportLayer = FetchHttpClient.layer,
}: WebUntisRuntimeOptions) => {
  const baseLayer = Layer.mergeAll(ClientConfig.layer(config), transportLayer);
  const discoveryLayer = SchoolDiscovery.layerNoDeps.pipe(
    Layer.provide(baseLayer),
  );
  const schoolResolverLayer = SchoolResolver.layerNoDeps.pipe(
    Layer.provide(Layer.mergeAll(ClientConfig.layer(config), discoveryLayer)),
  );
  const sessionLayer = SessionState.layerNoDeps.pipe(
    Layer.provide(
      Layer.mergeAll(
        ClientConfig.layer(config),
        transportLayer,
        schoolResolverLayer,
      ),
    ),
  );
  const metadataLayer = MetadataState.layerNoDeps.pipe(
    Layer.provide(sessionLayer),
  );
  const httpLayer = WebUntisHttp.layerNoDeps.pipe(
    Layer.provide(Layer.mergeAll(sessionLayer, metadataLayer)),
  );
  const rawViewApiLayer = RawViewApiClient.layerNoDeps.pipe(
    Layer.provide(httpLayer),
  );

  return Layer.mergeAll(
    discoveryLayer,
    schoolResolverLayer,
    sessionLayer,
    metadataLayer,
    httpLayer,
    rawViewApiLayer,
  );
};
