import { Context, Effect, Layer, Schema, SynchronizedRef } from "effect";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import {
  AuthError,
  type DecodeError,
  type DiscoveryError,
  decodeError,
  httpClientErrorToTransportError,
  type TransportError,
} from "./errors.ts";
import { EntityId, runtimeJsonParseOptions } from "./schema.ts";
import { SessionState } from "./session-state.ts";
import type { AuthenticatedState, MetadataCache, MetadataSnapshot } from "./state.ts";
import { emptyMetadataState, hasMetadataForSession, toMetadataSnapshot } from "./state.ts";
import { resolveBaseUrl } from "./url.ts";

// Minimal projection of `app/data`. Metadata bootstrap runs before the request
// policy that `AppDataSchema` decoding depends on, so it deliberately reads only
// the two fields it needs rather than sharing the full public schema.
const BootstrapAppDataSchema = Schema.Struct({
  currentSchoolYear: Schema.NullOr(Schema.Struct({ id: EntityId })),
  tenant: Schema.Struct({ id: Schema.String }),
});

export interface MetadataStateShape {
  readonly ensureMetadata: Effect.Effect<
    MetadataSnapshot,
    DiscoveryError | AuthError | TransportError | DecodeError
  >;
  readonly clear: Effect.Effect<void>;
}

export class MetadataState extends Context.Service<MetadataState, MetadataStateShape>()(
  "webuntis/internal/MetadataState",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const sessionState = yield* SessionState;
      const stateRef = yield* SynchronizedRef.make<MetadataCache>(emptyMetadataState());

      const fetchMetadata = (
        session: AuthenticatedState,
        mayRetry = true,
      ): Effect.Effect<
        readonly [MetadataSnapshot, MetadataCache],
        DiscoveryError | AuthError | TransportError | DecodeError
      > =>
        Effect.gen(function* () {
          const response = yield* sessionState.client
            .execute(
              HttpClientRequest.get(
                `${resolveBaseUrl(session.resolvedSchool)}/api/rest/view/v1/app/data`,
              ).pipe(HttpClientRequest.acceptJson, HttpClientRequest.bearerToken(session.token)),
            )
            .pipe(
              Effect.mapError((error) =>
                httpClientErrorToTransportError("GET", "api/rest/view/v1/app/data", error),
              ),
            );

          if (response.status < 200 || response.status >= 300) {
            const body = yield* response.text.pipe(Effect.orElseSucceed(() => ""));

            if (mayRetry && (response.status === 401 || response.status === 403)) {
              yield* sessionState.invalidate(session.generation);
              const refreshedSession = yield* sessionState.ensureAuthenticated;
              return yield* fetchMetadata(refreshedSession, false);
            }

            return yield* new AuthError({
              stage: "metadata",
              status: response.status,
              message: `Metadata bootstrap failed: ${body}`,
            });
          }

          const appData = yield* HttpClientResponse.schemaBodyJson(
            BootstrapAppDataSchema,
            runtimeJsonParseOptions,
          )(response).pipe(
            Effect.mapError((error) => decodeError("api/rest/view/v1/app/data", error)),
          );

          const metadata = {
            tenantId: appData.tenant.id,
            schoolYearId: appData.currentSchoolYear?.id,
            sessionGeneration: session.generation,
          } satisfies MetadataCache;

          return [toMetadataSnapshot(session, metadata), metadata] as const;
        });

      const ensureMetadata = Effect.gen(function* () {
        const session = yield* sessionState.ensureAuthenticated;

        return yield* SynchronizedRef.modifyEffect(stateRef, (metadata) =>
          hasMetadataForSession(metadata, session)
            ? Effect.succeed([toMetadataSnapshot(session, metadata), metadata] as const)
            : fetchMetadata(session),
        );
      });

      return MetadataState.of({
        ensureMetadata,
        clear: SynchronizedRef.set(stateRef, emptyMetadataState()),
      });
    }),
  );
}
