# ADR 0004: Connections are values, each with its own runtime

Status: accepted

## Context

Up to 0.3 the client read one school and one account from `WEBUNTIS_*` environment variables
and baked `fetch` into its layer. A server that imports several schools, or one school through
several accounts, could not express that. WebUntis also invalidates a session when the same
account logs in again elsewhere, so two clients must never share or fight over a session by
accident.

## Decision

A connection is a plain value: `{ school, credential }`. `school` is a resolved target or a
name that school search must match unambiguously. `credential` is a tagged union, so login
methods other than username and password can join without reshaping the connection.

`webUntisLayer(connection)` builds the whole service graph for one connection inside
`Layer.fresh`. The internal service layers are module-level values that Effect memoizes by
identity, including across nested provides and `LayerMap` entries. Without a fresh memo map, a
second connection could silently reuse the first one's session.

The layer requires `HttpClient` from context instead of choosing a platform client itself.
The library adds its own policy (transient retries, cookies) on top of whatever client the
caller provides. Login relies on `FetchHttpClient`'s `redirect: "manual"`.

Reading the environment is an explicit `Config` value, `WebUntisConnection.fromEnv`.

## Consequences

Several schools and accounts run side by side; callers key them with `LayerMap` when they need
sharing. Sibling `Effect.provide` calls of the same connection's layer build separate sessions,
which is correct isolation but costs a login each, so long-lived callers should build a layer
once. Tests and consumers swap the transport by providing a different `HttpClient`.
