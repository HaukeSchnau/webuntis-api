import type { Redacted } from "effect";

export const tokenFallbackValidityMs = 15 * 60 * 1_000;

export interface Credentials {
  readonly username: string;
  readonly password: Redacted.Redacted<string>;
}

export interface ResolvedSchool {
  readonly displayName: string;
  readonly loginName: string;
  readonly server: string;
  readonly serverUrl: string;
  readonly schoolId: number;
  readonly tenantId?: string | undefined;
}

export interface WebUntisClientConfig extends Credentials {
  readonly schoolName: string;
  readonly schoolLoginName?: string | undefined;
  readonly server?: string | undefined;
  readonly serverUrl?: string | undefined;
  readonly tenantId?: string | undefined;
  readonly discoveryEndpoint?: string | undefined;
}

export interface SessionState {
  readonly resolvedSchool?: ResolvedSchool | undefined;
  readonly token?: Redacted.Redacted<string> | undefined;
  readonly tokenExpiresAt?: number | undefined;
  readonly tenantId?: string | undefined;
  readonly generation: number;
}

export interface AuthenticatedState extends SessionState {
  readonly resolvedSchool: ResolvedSchool;
  readonly token: Redacted.Redacted<string>;
}

export interface MetadataState {
  readonly tenantId?: string | undefined;
  readonly schoolYearId?: number | undefined;
  readonly sessionGeneration: number;
}

export interface MetadataSnapshot extends AuthenticatedState {
  readonly tenantId: string;
  readonly schoolYearId?: number | undefined;
}

export const emptySessionState = (generation = 0): SessionState => ({
  generation,
});

export const emptyMetadataState = (): MetadataState => ({
  sessionGeneration: -1,
});

export const hasFreshToken = (state: SessionState, now: number): state is AuthenticatedState =>
  state.resolvedSchool !== undefined &&
  state.token !== undefined &&
  state.tokenExpiresAt !== undefined &&
  state.tokenExpiresAt - now > 60_000;

export const hasMetadataForSession = (
  metadata: MetadataState,
  session: AuthenticatedState,
): metadata is MetadataState & {
  readonly tenantId: string;
} => metadata.tenantId !== undefined && metadata.sessionGeneration === session.generation;

export const toMetadataSnapshot = (
  session: AuthenticatedState,
  metadata: MetadataState & {
    readonly tenantId: string;
  },
): MetadataSnapshot => ({
  ...session,
  tenantId: metadata.tenantId,
  schoolYearId: metadata.schoolYearId,
});

export const resolveBaseUrl = (school: ResolvedSchool): string => {
  const rawServerUrl = /^[a-z]+:\/\//i.test(school.serverUrl)
    ? school.serverUrl
    : `https://${school.serverUrl.replace(/^\/+/, "")}`;
  const url = new URL(rawServerUrl);
  const pathname = url.pathname.replace(/\/+$/, "");

  if (pathname === "" || pathname === "/") {
    return `${url.origin}/WebUntis`;
  }

  if (pathname === "/WebUntis" || pathname === "/WebUntis/index.do") {
    return `${url.origin}/WebUntis`;
  }

  if (pathname.startsWith("/WebUntis/")) {
    return `${url.origin}/WebUntis`;
  }

  return `${url.origin}${pathname}/WebUntis`;
};

export const resolveTenantHost = (config: WebUntisClientConfig): string | undefined => {
  if (config.server) {
    return config.server;
  }
  if (config.serverUrl) {
    return new URL(config.serverUrl).host;
  }
  return undefined;
};
