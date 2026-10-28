import type { Redacted } from "effect";
import type { InvalidCredentials } from "./errors.ts";

/** Lifetime assumed for a token whose `exp` claim could not be read. */
export const tokenFallbackValidityMs = 15 * 60 * 1_000;

/**
 * Margin by which a token must outlive "now" to be reused. Refreshing slightly
 * early is cheaper than letting an in-flight request race the expiry.
 */
export const tokenRefreshSkewMs = 60 * 1_000;

/** A school target with its server URL normalized to the `<origin>/WebUntis` request prefix. */
export interface ResolvedSchool {
  readonly loginName: string;
  readonly baseUrl: string;
  readonly tenantId?: string | undefined;
}

/**
 * Cached login state. `generation` increases on every successful login so a
 * stale 401 cannot invalidate a newer session (see ADR 0001).
 */
export interface SessionCache {
  /** Set once WebUntis refuses the credential; cleared by an explicit refresh or clear. */
  readonly rejected?: InvalidCredentials | undefined;
  readonly resolvedSchool?: ResolvedSchool | undefined;
  readonly token?: Redacted.Redacted | undefined;
  readonly tokenExpiresAt?: number | undefined;
  readonly tenantId?: string | undefined;
  readonly generation: number;
}

/** A {@link SessionCache} known to hold a resolved school and a live token. */
export interface AuthenticatedState extends SessionCache {
  readonly resolvedSchool: ResolvedSchool;
  readonly token: Redacted.Redacted;
}

/** Tenant and school-year headers cached for one session generation. */
export interface MetadataCache {
  readonly tenantId?: string | undefined;
  readonly schoolYearId?: number | undefined;
  readonly sessionGeneration: number;
}

/** Everything a metadata-policy request needs, in one value. */
export interface MetadataSnapshot extends AuthenticatedState {
  readonly tenantId: string;
  readonly schoolYearId?: number | undefined;
}

export const emptySessionState = (generation = 0): SessionCache => ({
  generation,
});

export const emptyMetadataState = (): MetadataCache => ({
  sessionGeneration: -1,
});

export const hasFreshToken = (state: SessionCache, now: number): state is AuthenticatedState =>
  state.resolvedSchool !== undefined &&
  state.token !== undefined &&
  state.tokenExpiresAt !== undefined &&
  state.tokenExpiresAt - now > tokenRefreshSkewMs;

export const hasMetadataForSession = (
  metadata: MetadataCache,
  session: AuthenticatedState,
): metadata is MetadataCache & {
  readonly tenantId: string;
} => metadata.tenantId !== undefined && metadata.sessionGeneration === session.generation;

export const toMetadataSnapshot = (
  session: AuthenticatedState,
  metadata: MetadataCache & {
    readonly tenantId: string;
  },
): MetadataSnapshot => ({
  ...session,
  tenantId: metadata.tenantId,
  schoolYearId: metadata.schoolYearId,
});
