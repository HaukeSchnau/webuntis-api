import { Effect, Layer, Schedule } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as HttpClient from "effect/unstable/http/HttpClient";
import type { ClientConfig } from "./config.ts";
import { SchoolDiscovery } from "./discovery.ts";
import { WebUntisHttp } from "./http.ts";
import { MetadataState } from "./metadata-state.ts";
import { SchoolResolver } from "./school-resolver.ts";
import { SessionState } from "./session-state.ts";

export interface WebUntisRuntimeOptions<ConfigError> {
  readonly configLayer: Layer.Layer<ClientConfig, ConfigError>;
  readonly transportLayer?: Layer.Layer<HttpClient.HttpClient> | undefined;
}

const transientRetrySchedule = Schedule.exponential("500 millis").pipe(Schedule.jittered);

/**
 * Retries transport failures, timeouts, rate limiting, and transient HTTP responses before the
 * WebUntis protocol layer decodes them. Permanent response and schema failures remain single-shot.
 */
export const withTransientRetries = <E, R>(client: HttpClient.HttpClient.With<E, R>) =>
  client.pipe(
    HttpClient.retryTransient({
      retryOn: "errors-and-responses",
      schedule: transientRetrySchedule,
      times: 2,
    }),
  );

const defaultTransportLayer = Layer.effect(
  HttpClient.HttpClient,
  Effect.map(HttpClient.HttpClient, withTransientRetries),
).pipe(Layer.provide(FetchHttpClient.layer));

/**
 * Builds the shared runtime every domain service sits on. The returned layer is
 * a single value, so providing it once gives all services the same session,
 * metadata cache, and cookie jar.
 */
export const makeWebUntisCoreLayer = <ConfigError>({
  configLayer,
  transportLayer = defaultTransportLayer,
}: WebUntisRuntimeOptions<ConfigError>) => {
  const baseLayer = Layer.mergeAll(configLayer, transportLayer);
  const discoveryLayer = SchoolDiscovery.layer.pipe(Layer.provideMerge(baseLayer));
  const schoolResolverLayer = SchoolResolver.layer.pipe(Layer.provideMerge(discoveryLayer));
  const sessionLayer = SessionState.layer.pipe(Layer.provideMerge(schoolResolverLayer));
  const metadataLayer = MetadataState.layer.pipe(Layer.provideMerge(sessionLayer));
  return WebUntisHttp.layer.pipe(Layer.provideMerge(metadataLayer));
};
