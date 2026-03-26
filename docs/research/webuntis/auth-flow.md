# Auth And Token Minting

Observed against `https://igs-lilienthal.webuntis.com/` on March 11, 2026.

## Flow Summary

1. Resolve the tenant host and school slug from the public school-search API.
2. Submit credentials to the classic login endpoint:

```http
POST /WebUntis/j_spring_security_check
Content-Type: application/x-www-form-urlencoded

school=igs-lilienthal&j_username=<username>&j_password=<password>
```

3. On success, the server responds with `302 /WebUntis/index.do` and sets a session cookie set that includes:

- `JSESSIONID` (HttpOnly)
- `schoolname`
- `Tenant-Id`

4. Reuse those cookies when calling:

```http
GET /WebUntis/api/token/new
```

5. If the session is authenticated, `api/token/new` returns `200` with a JWT in the response body.
6. The modern REST endpoints under `/WebUntis/api/rest/view/...` require that JWT as `Authorization: Bearer <token>`.

## Success Versus Failure

- Successful login:
  - `POST /WebUntis/j_spring_security_check` returns `302 /WebUntis/index.do`
  - `GET /WebUntis/api/token/new` with the resulting cookies returns `200` and a JWT body
- Failed login:
  - `POST /WebUntis/j_spring_security_check` still returns `302 /WebUntis/index.do`
  - `GET /WebUntis/api/token/new` with the resulting cookies returns `302 https://igs-lilienthal.webuntis.com/WebUntis/index.do`

## Additional Observations

- `GET /WebUntis/api/token/new` without an authenticated cookie set redirects to the anonymous `index.do` page.
- Direct fetches to `/WebUntis/api/rest/view/...` without a bearer token did not behave like a clean `401`; one observed response was a `404 NOT_FOUND`.
- The SPA stores the minted JWT in `localStorage` as `tokenString`, but the shipped client does not need browser storage if it can repeat the login and token-mint flow headlessly.
- The anonymous `index.do` page exposes classic boot configuration and legacy service descriptors. Those are out of scope for the modern REST-first client.
