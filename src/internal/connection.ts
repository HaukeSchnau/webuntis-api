import { Config, Context, Data, Effect, Layer, Option, type Redacted } from "effect";
import { ConfigurationError } from "./errors.ts";
import { resolveBaseUrl } from "./url.ts";

/**
 * How a connection proves who it is. A tagged union so that further WebUntis
 * login methods can join without changing the connection shape.
 *
 * ```ts
 * Credential.Password({ username: "jane", password: Redacted.make("secret") });
 * ```
 */
export type Credential = Data.TaggedEnum<{
  Password: {
    readonly username: string;
    readonly password: Redacted.Redacted;
  };
}>;

export const Credential = Data.taggedEnum<Credential>();

/**
 * Where one WebUntis school lives. Every `School` returned by `searchSchools`
 * satisfies it, so a search result can be stored and passed back unchanged.
 */
export interface SchoolTarget {
  /** The school's login name, for example `igs-lilienthal`. */
  readonly loginName: string;
  /** A host or any URL on the school's WebUntis server. */
  readonly serverUrl: string;
  /** Sent as `Tenant-Id`. When absent, it is read from `app/data` after login. */
  readonly tenantId?: string | undefined;
}

/** Everything needed to reach and authenticate against one school as one account. */
export interface WebUntisConnection {
  /**
   * A school you already resolved, or a name that school search must match
   * unambiguously when the connection first logs in.
   */
  readonly school: string | SchoolTarget;
  readonly credential: Credential;
}

const pinnedSchool = Config.all({
  loginName: Config.String("WEBUNTIS_SCHOOL_LOGIN_NAME"),
  serverUrl: Config.String("WEBUNTIS_SERVER_URL"),
  tenantId: Config.option(Config.String("WEBUNTIS_TENANT_ID")).pipe(
    Config.map(Option.getOrUndefined),
  ),
});

export const WebUntisConnection = {
  /**
   * Reads one connection from `WEBUNTIS_*` settings through the current
   * `ConfigProvider`, which is the process environment unless you install
   * another. `WEBUNTIS_SCHOOL_LOGIN_NAME` plus `WEBUNTIS_SERVER_URL` pin the
   * school; otherwise `WEBUNTIS_SCHOOL_NAME` is looked up through school search.
   */
  fromEnv: Config.all({
    school: pinnedSchool.pipe(
      Config.orElse(() => Config.String("WEBUNTIS_SCHOOL_NAME")),
    ) satisfies Config.Config<WebUntisConnection["school"]>,
    credential: Config.all({
      username: Config.String("WEBUNTIS_USERNAME"),
      password: Config.Redacted("WEBUNTIS_PASSWORD"),
    }).pipe(Config.map(Credential.Password)),
  }) satisfies Config.Config<WebUntisConnection>,
};

/** The connection one client graph was built for. */
export class Connection extends Context.Service<Connection, WebUntisConnection>()(
  "webuntis/internal/Connection",
) {
  /** Rejects a pinned school whose server URL cannot address WebUntis. */
  static readonly layer = (connection: WebUntisConnection) =>
    Layer.effect(
      this,
      typeof connection.school === "string" || resolveBaseUrl(connection.school) !== undefined
        ? Effect.succeed(connection)
        : Effect.fail(
            new ConfigurationError({
              message: `serverUrl ${JSON.stringify(connection.school.serverUrl)} is not an HTTP(S) URL or host`,
            }),
          ),
    );
}
