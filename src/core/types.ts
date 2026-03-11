import type { Redacted } from "effect";
import * as Cookies from "effect/unstable/http/Cookies";

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
  readonly cookies: Cookies.Cookies;
  readonly resolvedSchool?: ResolvedSchool | undefined;
  readonly token?: Redacted.Redacted<string> | undefined;
  readonly tokenExpiresAt?: number | undefined;
  readonly tenantId?: string | undefined;
  readonly schoolYearId?: number | undefined;
}

export const emptySessionState = (): SessionState => ({
  cookies: Cookies.empty
});

export const resolveBaseUrl = (school: ResolvedSchool): string => {
  const serverUrl = school.serverUrl.replace(/\/+$/, "");
  if (serverUrl.endsWith("/WebUntis")) {
    return serverUrl;
  }
  if (serverUrl.includes("/WebUntis/?school=")) {
    return serverUrl.split("/?school=")[0]!;
  }
  return `${serverUrl}/WebUntis`;
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
