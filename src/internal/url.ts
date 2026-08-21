import type { WebUntisClientConfig } from "./config.ts";
import type { ResolvedSchool } from "./state.ts";

/**
 * Normalizes the many shapes a WebUntis `serverUrl` arrives in — bare host,
 * origin only, `/WebUntis`, `/WebUntis/index.do`, with or without a query — to
 * the single `<origin>/WebUntis` prefix every request is built from.
 */
export const resolveBaseUrl = (school: ResolvedSchool): string => {
  const rawServerUrl = /^[a-z]+:\/\//iu.test(school.serverUrl)
    ? school.serverUrl
    : `https://${school.serverUrl.replace(/^\/+/u, "")}`;
  const url = new URL(rawServerUrl);
  const pathname = url.pathname.replace(/\/+$/u, "");

  if (
    pathname === "" ||
    pathname === "/" ||
    pathname === "/WebUntis" ||
    pathname === "/WebUntis/index.do" ||
    pathname.startsWith("/WebUntis/")
  ) {
    return `${url.origin}/WebUntis`;
  }

  return `${url.origin}${pathname}/WebUntis`;
};

/** Host to pin the tenant to, when the caller configured one explicitly. */
export const resolveTenantHost = (config: WebUntisClientConfig): string | undefined => {
  if (config.server !== undefined && config.server !== "") {
    return config.server;
  }
  if (config.serverUrl !== undefined && config.serverUrl !== "") {
    return new URL(config.serverUrl).host;
  }
  return undefined;
};
