import { Context, Effect, Layer, SynchronizedRef } from "effect";
import { ClientConfig } from "./config.ts";
import { SchoolDiscovery } from "./discovery.ts";
import type { DecodeError, DiscoveryError, TransportError } from "./errors.ts";
import type { ResolvedSchool } from "./state.ts";
import { resolveTenantHost } from "./url.ts";

export interface SchoolResolverShape {
  readonly resolve: Effect.Effect<ResolvedSchool, DiscoveryError | TransportError | DecodeError>;
}

export class SchoolResolver extends Context.Service<SchoolResolver, SchoolResolverShape>()(
  "webuntis/internal/SchoolResolver",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const clientConfig = yield* ClientConfig;
      const discovery = yield* SchoolDiscovery;
      const cacheRef = yield* SynchronizedRef.make<ResolvedSchool | undefined>(undefined);

      const resolveConfiguredSchool = (): ResolvedSchool | undefined => {
        const tenantHost = resolveTenantHost(clientConfig);
        if (tenantHost === undefined || clientConfig.schoolLoginName === undefined) {
          return undefined;
        }

        return {
          displayName: clientConfig.schoolName,
          loginName: clientConfig.schoolLoginName,
          server: tenantHost,
          serverUrl:
            clientConfig.serverUrl ??
            `https://${tenantHost}/WebUntis/?school=${clientConfig.schoolLoginName}`,
          schoolId: 0,
          tenantId: clientConfig.tenantId,
        };
      };

      const resolve = SynchronizedRef.modifyEffect(cacheRef, (cached) => {
        if (cached !== undefined) {
          return Effect.succeed([cached, cached] as const);
        }

        const configured = resolveConfiguredSchool();
        if (configured !== undefined) {
          return Effect.succeed([configured, configured] as const);
        }

        return discovery
          .resolve(clientConfig.schoolName)
          .pipe(Effect.map((resolved) => [resolved, resolved] as const));
      });

      return SchoolResolver.of({
        resolve,
      });
    }),
  );
}
