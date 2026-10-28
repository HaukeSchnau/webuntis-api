import { Context, Effect, Layer, SynchronizedRef } from "effect";
import { HttpClient } from "effect/http";
import { Connection, type SchoolTarget } from "./connection.ts";
import { findSchool } from "./discovery.ts";
import { type DecodeError, DiscoveryError, type TransportError } from "./errors.ts";
import type { ResolvedSchool } from "./state.ts";
import { resolveBaseUrl } from "./url.ts";

export interface SchoolResolverShape {
  readonly resolve: Effect.Effect<ResolvedSchool, DiscoveryError | TransportError | DecodeError>;
}

const toResolvedSchool = (query: string, target: SchoolTarget) => {
  const baseUrl = resolveBaseUrl(target);
  return baseUrl === undefined
    ? Effect.fail(
        new DiscoveryError({
          query,
          message: `WebUntis returned an unusable server URL ${JSON.stringify(target.serverUrl)}`,
        }),
      )
    : Effect.succeed<ResolvedSchool>({
        loginName: target.loginName,
        baseUrl,
        tenantId: target.tenantId,
      });
};

/** Resolves the connection's school once and caches the target for every later login. */
export class SchoolResolver extends Context.Service<SchoolResolver, SchoolResolverShape>()(
  "webuntis/internal/SchoolResolver",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { school } = yield* Connection;
      const client = yield* HttpClient.HttpClient;
      const cacheRef = yield* SynchronizedRef.make<ResolvedSchool | undefined>(undefined);

      const lookup =
        typeof school === "string"
          ? findSchool(school).pipe(
              Effect.provideService(HttpClient.HttpClient, client),
              Effect.flatMap((found) => toResolvedSchool(school, found)),
            )
          : toResolvedSchool(school.loginName, school);

      const resolve = SynchronizedRef.modifyEffect(cacheRef, (cached) =>
        cached === undefined
          ? lookup.pipe(Effect.map((resolved) => [resolved, resolved] as const))
          : Effect.succeed([cached, cached] as const),
      );

      return SchoolResolver.of({ resolve });
    }),
  );
}
