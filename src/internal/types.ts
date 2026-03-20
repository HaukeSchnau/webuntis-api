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
  readonly tenantId: string;
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
  readonly tenantId: string;
}

export interface MetadataState {
  readonly tenantId?: string | undefined;
  readonly schoolYearId?: number | undefined;
  readonly sessionGeneration: number;
}

export interface MetadataSnapshot extends AuthenticatedState {
  readonly tenantId: string;
  readonly schoolYearId: number;
}

export const emptySessionState = (): SessionState => ({
  generation: 0,
});

export const emptyMetadataState = (): MetadataState => ({
  sessionGeneration: -1,
});

export const hasFreshToken = (
  state: SessionState,
  now = Date.now(),
): state is AuthenticatedState =>
  state.resolvedSchool !== undefined &&
  state.token !== undefined &&
  state.tenantId !== undefined &&
  state.tokenExpiresAt !== undefined &&
  state.tokenExpiresAt - now > 60_000;

export const hasMetadataForSession = (
  metadata: MetadataState,
  session: AuthenticatedState,
): metadata is MetadataState & {
  readonly tenantId: string;
  readonly schoolYearId: number;
} =>
  metadata.tenantId !== undefined &&
  metadata.schoolYearId !== undefined &&
  metadata.sessionGeneration === session.generation;

export const toMetadataSnapshot = (
  session: AuthenticatedState,
  metadata: MetadataState & {
    readonly tenantId: string;
    readonly schoolYearId: number;
  },
): MetadataSnapshot => ({
  ...session,
  tenantId: metadata.tenantId,
  schoolYearId: metadata.schoolYearId,
});

export const resolveBaseUrl = (school: ResolvedSchool): string => {
  const serverUrl = school.serverUrl.replace(/\/+$/, "");
  if (serverUrl.endsWith("/WebUntis")) {
    return serverUrl;
  }
  if (serverUrl.includes("/WebUntis/?school=")) {
    const [baseUrl] = serverUrl.split("/?school=");
    if (baseUrl !== undefined) {
      return baseUrl;
    }
  }
  return `${serverUrl}/WebUntis`;
};

export const resolveTenantHost = (
  config: WebUntisClientConfig,
): string | undefined => {
  if (config.server) {
    return config.server;
  }
  if (config.serverUrl) {
    return new URL(config.serverUrl).host;
  }
  return undefined;
};
