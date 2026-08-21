import type { Redacted } from "effect";

/** Lifetime assumed for a token whose `exp` claim could not be read. */
export const tokenFallbackValidityMs = 15 * 60 * 1_000;

/**
 * Margin by which a token must outlive "now" to be reused. Refreshing slightly
 * early is cheaper than letting an in-flight request race the expiry.
 */
export const tokenRefreshSkewMs = 60 * 1_000;

/** A WebUntis school resolved to a concrete request target. */
export interface ResolvedSchool {
  readonly displayName: string;
  readonly loginName: string;
  readonly server: string;
  readonly serverUrl: string;
  readonly schoolId: number;
  readonly tenantId?: string | undefined;
}

/**
 * Cached login state. `generation` increases on every successful login so a
 * stale 401 cannot invalidate a newer session (see ADR 0001).
 */
export interface SessionCache {
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
