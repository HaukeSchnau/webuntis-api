import { Layer } from "effect";
import { RateLimiter } from "effect/persistence";
import { Connection, type WebUntisConnection } from "./connection.ts";
import { WebUntisHttp } from "./http.ts";
import { MetadataState } from "./metadata-state.ts";
import { SchoolResolver } from "./school-resolver.ts";
import { SessionState } from "./session-state.ts";

/**
 * Builds the runtime every domain service of one connection sits on. The
 * returned layer is a single value, so providing it once gives all services the
 * same session, metadata cache, and cookie jar. Each call builds an independent
 * graph, which is what keeps several schools and accounts apart in one process.
 */
export const makeWebUntisCoreLayer = (connection: WebUntisConnection) => {
  // In-memory, and fresh per connection because `webUntisLayer` builds in `Layer.fresh`.
  const limiterLayer = RateLimiter.layer.pipe(Layer.provide(RateLimiter.layerStoreMemory));
  const connectionLayer = Layer.mergeAll(Connection.layer(connection), limiterLayer);
  const schoolResolverLayer = SchoolResolver.layer.pipe(Layer.provideMerge(connectionLayer));
  const sessionLayer = SessionState.layer.pipe(Layer.provideMerge(schoolResolverLayer));
  const metadataLayer = MetadataState.layer.pipe(Layer.provideMerge(sessionLayer));
  return WebUntisHttp.layer.pipe(Layer.provideMerge(metadataLayer));
};
