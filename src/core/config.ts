import { Effect, Redacted, ServiceMap } from "effect";
import {
  type WebUntisClientConfig
} from "./types.ts";
import { MissingConfigurationError } from "./errors.ts";

export interface ClientConfig extends WebUntisClientConfig {}

export const ClientConfig = ServiceMap.Service<ClientConfig, ClientConfig>("webuntis/ClientConfig");

export interface LiveEnvInput {
  readonly schoolName?: string | undefined;
  readonly schoolLoginName?: string | undefined;
  readonly server?: string | undefined;
  readonly serverUrl?: string | undefined;
  readonly tenantId?: string | undefined;
  readonly username?: string | undefined;
  readonly password?: string | undefined;
}

export const fromEnv = (
  env: LiveEnvInput = {
    schoolName: process.env.WEBUNTIS_SCHOOL_NAME,
    schoolLoginName: process.env.WEBUNTIS_SCHOOL_LOGIN_NAME,
    server: process.env.WEBUNTIS_SERVER,
    serverUrl: process.env.WEBUNTIS_SERVER_URL,
    tenantId: process.env.WEBUNTIS_TENANT_ID,
    username: process.env.WEBUNTIS_USERNAME,
    password: process.env.WEBUNTIS_PASSWORD
  }
): Effect.Effect<WebUntisClientConfig, MissingConfigurationError> =>
  Effect.gen(function*() {
    const missing = [
      env.schoolName ? undefined : "WEBUNTIS_SCHOOL_NAME",
      env.username ? undefined : "WEBUNTIS_USERNAME",
      env.password ? undefined : "WEBUNTIS_PASSWORD"
    ].filter((field): field is string => field !== undefined);

    if (missing.length > 0) {
      return yield* Effect.fail(new MissingConfigurationError({ fields: missing }));
    }

    return {
      schoolName: env.schoolName!,
      schoolLoginName: env.schoolLoginName,
      server: env.server,
      serverUrl: env.serverUrl,
      tenantId: env.tenantId,
      username: env.username!,
      password: Redacted.make(env.password!)
    } satisfies WebUntisClientConfig;
  });
