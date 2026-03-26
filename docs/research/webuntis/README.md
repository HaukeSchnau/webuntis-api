# WebUntis Reverse-Engineering Artifacts

These artifacts capture the current headless integration findings from March 11, 2026.

- `school-discovery.json` documents the public school-search contract used from `https://webuntis.com/`.
- `auth-flow.md` documents the classic login handshake, cookie bootstrap, and token minting behavior.
- `modern-rest-endpoints.json` catalogs the modern REST-style endpoints discovered from the shipped frontend bundle at `https://igs-lilienthal.webuntis.com/assets/index-B54Mbe15.js`.

Notes:

- Volatile values such as request IDs, JWTs, timestamps, request IDs, and session IDs are redacted or normalized.
- The endpoint catalog is discovery-only. It reflects routes embedded in the frontend bundle, not a guarantee that every route is enabled for every tenant or role.
- Legacy classic `json*Service` endpoints visible in the anonymous `index.do` bootstrapping page are intentionally not cataloged here.
