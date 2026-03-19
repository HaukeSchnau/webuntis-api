import { ConfigProvider, Effect, Layer, Option, ServiceMap } from "effect";
import * as Config from "effect/Config";
import {
  ConfigurationError
} from "./errors.ts";
import {
  type WebUntisClientConfig
} from "./types.ts";

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
  readonly discoveryEndpoint?: string | undefined;
}

const optionalString = (name: string) =>
  Config.option(Config.string(name)).pipe(
    Config.map((value) => Option.isSome(value) ? value.value : undefined)
  );

export const config = Config.unwrap({
  schoolName: Config.string("WEBUNTIS_SCHOOL_NAME"),
  schoolLoginName: optionalString("WEBUNTIS_SCHOOL_LOGIN_NAME"),
  server: optionalString("WEBUNTIS_SERVER"),
  serverUrl: optionalString("WEBUNTIS_SERVER_URL"),
  tenantId: optionalString("WEBUNTIS_TENANT_ID"),
  username: Config.string("WEBUNTIS_USERNAME"),
  password: Config.redacted("WEBUNTIS_PASSWORD"),
  discoveryEndpoint: optionalString("WEBUNTIS_DISCOVERY_ENDPOINT")
}) satisfies Config.Config<WebUntisClientConfig>;

const definedEnvEntries = (env: LiveEnvInput): Record<string, string> =>
  Object.fromEntries(
    Object.entries({
      WEBUNTIS_SCHOOL_NAME: env.schoolName,
      WEBUNTIS_SCHOOL_LOGIN_NAME: env.schoolLoginName,
      WEBUNTIS_SERVER: env.server,
      WEBUNTIS_SERVER_URL: env.serverUrl,
      WEBUNTIS_TENANT_ID: env.tenantId,
      WEBUNTIS_USERNAME: env.username,
      WEBUNTIS_PASSWORD: env.password,
      WEBUNTIS_DISCOVERY_ENDPOINT: env.discoveryEndpoint
    }).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );

const mapConfigError = (error: Config.ConfigError) =>
  new ConfigurationError({ message: error.message });

export const fromEnv = (
  env: LiveEnvInput = {
    schoolName: process.env["WEBUNTIS_SCHOOL_NAME"],
    schoolLoginName: process.env["WEBUNTIS_SCHOOL_LOGIN_NAME"],
    server: process.env["WEBUNTIS_SERVER"],
    serverUrl: process.env["WEBUNTIS_SERVER_URL"],
    tenantId: process.env["WEBUNTIS_TENANT_ID"],
    username: process.env["WEBUNTIS_USERNAME"],
    password: process.env["WEBUNTIS_PASSWORD"],
    discoveryEndpoint: process.env["WEBUNTIS_DISCOVERY_ENDPOINT"]
  }
): Effect.Effect<WebUntisClientConfig, ConfigurationError> =>
  config.parse(ConfigProvider.fromEnv({ env: definedEnvEntries(env) })).pipe(
    Effect.mapError(mapConfigError)
  );

export const layer = (clientConfig: ClientConfig) => Layer.succeed(ClientConfig, clientConfig);

export const Live = Layer.effect(ClientConfig, fromEnv());
