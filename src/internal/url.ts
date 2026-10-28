/**
 * Normalizes the many shapes a WebUntis `serverUrl` arrives in — bare host,
 * origin only, `/WebUntis`, `/WebUntis/index.do`, with or without a query — to
 * the single `<origin>/WebUntis` prefix every request is built from. Returns
 * `undefined` for anything that is not an HTTP(S) URL or host.
 */
export const resolveBaseUrl = (target: { readonly serverUrl: string }): string | undefined => {
  const rawServerUrl = /^[a-z]+:\/\//iu.test(target.serverUrl)
    ? target.serverUrl
    : `https://${target.serverUrl.replace(/^\/+/u, "")}`;
  if (!URL.canParse(rawServerUrl)) {
    return undefined;
  }

  const url = new URL(rawServerUrl);
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.hostname === "") {
    return undefined;
  }

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
