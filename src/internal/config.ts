import { ConfigProvider, Context, Effect, Layer, Option, type Redacted } from "effect";
import * as Config from "effect/Config";
import { ConfigurationError } from "./errors.ts";

export interface Credentials {
  readonly username: string;
  readonly password: Redacted.Redacted;
}

/** Everything the client needs to reach and authenticate against one tenant. */
export interface WebUntisClientConfig extends Credentials {
  readonly schoolName: string;
  readonly schoolLoginName?: string | undefined;
  readonly server?: string | undefined;
  readonly serverUrl?: string | undefined;
  readonly tenantId?: string | undefined;
  readonly discoveryEndpoint?: string | undefined;
}

/** Explicit configuration record, as an alternative to reading the environment. */
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
    Config.map((value) => (Option.isSome(value) ? value.value : undefined)),
  );

const envVariables = (env: LiveEnvInput) => ({
  WEBUNTIS_SCHOOL_NAME: env.schoolName,
  WEBUNTIS_SCHOOL_LOGIN_NAME: env.schoolLoginName,
  WEBUNTIS_SERVER: env.server,
  WEBUNTIS_SERVER_URL: env.serverUrl,
  WEBUNTIS_TENANT_ID: env.tenantId,
  WEBUNTIS_USERNAME: env.username,
  WEBUNTIS_PASSWORD: env.password,
  WEBUNTIS_DISCOVERY_ENDPOINT: env.discoveryEndpoint,
});

const processEnvInput = (): LiveEnvInput => ({
  schoolName: process.env["WEBUNTIS_SCHOOL_NAME"],
  schoolLoginName: process.env["WEBUNTIS_SCHOOL_LOGIN_NAME"],
  server: process.env["WEBUNTIS_SERVER"],
  serverUrl: process.env["WEBUNTIS_SERVER_URL"],
  tenantId: process.env["WEBUNTIS_TENANT_ID"],
  username: process.env["WEBUNTIS_USERNAME"],
  password: process.env["WEBUNTIS_PASSWORD"],
  discoveryEndpoint: process.env["WEBUNTIS_DISCOVERY_ENDPOINT"],
});

export class ClientConfig extends Context.Service<ClientConfig, WebUntisClientConfig>()(
  "webuntis/internal/ClientConfig",
) {
  static readonly config = Config.unwrap({
    schoolName: Config.string("WEBUNTIS_SCHOOL_NAME"),
    schoolLoginName: optionalString("WEBUNTIS_SCHOOL_LOGIN_NAME"),
    server: optionalString("WEBUNTIS_SERVER"),
    serverUrl: optionalString("WEBUNTIS_SERVER_URL"),
    tenantId: optionalString("WEBUNTIS_TENANT_ID"),
    username: Config.string("WEBUNTIS_USERNAME"),
    password: Config.redacted("WEBUNTIS_PASSWORD"),
    discoveryEndpoint: optionalString("WEBUNTIS_DISCOVERY_ENDPOINT"),
  }) satisfies Config.Config<WebUntisClientConfig>;

  static readonly mapConfigError = (error: Config.ConfigError) =>
    new ConfigurationError({ message: error.message, cause: error });

  /**
   * Loads configuration through the ambient `ConfigProvider`, which reads the
   * process environment unless the caller installs a different provider.
   */
  static readonly load: Effect.Effect<WebUntisClientConfig, ConfigurationError> = Effect.suspend(
    () => ClientConfig.config,
  ).pipe(
    Effect.mapError(ClientConfig.mapConfigError),
    Effect.flatMap((config) => ClientConfig.validateUrls(config)),
  );

  /**
   * Loads configuration from an explicit record, bypassing the ambient
   * `ConfigProvider`. Defaults to the process environment, so `fromEnv()` stays
   * usable where installing a provider would be inconvenient. Prefer
   * {@link ClientConfig.load} when the ambient provider should win.
   */
  static readonly fromEnv = (
    env: LiveEnvInput = processEnvInput(),
  ): Effect.Effect<WebUntisClientConfig, ConfigurationError> =>
    this.config
      .parse(
        ConfigProvider.fromEnv({
          env: Object.fromEntries(
            Object.entries(envVariables(env)).filter(
              (entry): entry is [string, string] => entry[1] !== undefined,
            ),
          ),
        }),
      )
      .pipe(
        Effect.mapError(this.mapConfigError),
        Effect.flatMap((config) => this.validateUrls(config)),
      );

  static readonly validateUrls = (
    config: WebUntisClientConfig,
  ): Effect.Effect<WebUntisClientConfig, ConfigurationError> => {
    const validateField = (value: string | undefined, field: string) => {
      if (value === undefined) {
        return Effect.void;
      }

      const url = URL.canParse(value) ? new URL(value) : undefined;
      if (url !== undefined && (url.protocol === "https:" || url.protocol === "http:")) {
        return Effect.void;
      }

      return Effect.fail(
        new ConfigurationError({
          message: `${field} must be a valid HTTP(S) URL`,
        }),
      );
    };

    return Effect.all([
      validateField(config.serverUrl, "WEBUNTIS_SERVER_URL"),
      validateField(config.discoveryEndpoint, "WEBUNTIS_DISCOVERY_ENDPOINT"),
    ]).pipe(Effect.as(config));
  };

  static readonly layer = (clientConfig: WebUntisClientConfig) => Layer.succeed(this, clientConfig);

  /** Configuration resolved from the ambient `ConfigProvider` at layer build time. */
  static readonly Live = Layer.effect(this, ClientConfig.load);
}

/** Convenience alias for {@link ClientConfig.fromEnv}. */
export const clientConfigFromEnv = ClientConfig.fromEnv;
