# Project context

## Purpose

`webuntis-api` is a headless, read-only Effect v4 client for WebUntis' modern REST endpoints. It favors typed, stable business reads over complete exposure of reverse-engineered routes.

## Domain language

- **School target**: the resolved server URL, login name, and tenant identity for one WebUntis school.
- **Session**: cookies plus a bearer token. A monotonically increasing generation identifies which login produced the state.
- **Metadata**: tenant and current-school-year headers derived from authenticated `app/data`.
- **Request descriptor**: the single definition of an endpoint's method, path, input validation, query encoding, response schema, and auth policy.
- **School-year scope**: fiber-local context that adds a historical school-year header without leaking between nested or concurrent reads.
- **Drift check**: strict decoding used by contract tests and targeted raw live probes to reveal additive upstream changes.

## Architecture

Dependencies point inward from public domain services to the descriptor transport, then outward to WebUntis at the runtime edge:

1. `src/domains/<domain>/schema.ts` models responses, `requests.ts` owns route descriptors and derives the caller-facing request types from their input schemas, and `index.ts` declares the public service interface.
2. `src/internal/http.ts` validates and executes descriptors; `src/internal/domain.ts` turns a descriptor into the operation shape a service exposes.
3. session, metadata, discovery, and configuration services own mutable runtime concerns, split across `state.ts` (the session and metadata model), `url.ts` (base-URL resolution), and the services that use them.
4. `src/client.ts` is the sole public composition root and shares one core runtime across all domain services.

Raw research routes remain internal. The public schema surface is exactly the union of the `src/domains/*/schema.ts` modules, re-exported by `src/domains/schemas.ts`; anything that is an implementation detail of the transport lives under `src/internal` and is therefore unreachable from the package contract. That boundary is structural rather than a hand-maintained list, so a new response schema is public by construction and a new bootstrap projection is not.

## Invariants

- The client is read-only.
- Invalid caller input fails before transport.
- Authentication is single-flight, session generations never go backwards, and stale 401s cannot clear newer state.
- A request retries authentication at most once and resolves the same header policy on both attempts.
- Runtime decoding accepts additive fields but rejects malformed known fields; strict contract tests and targeted raw live probes retain drift visibility.
- Effect is a peer dependency so consumers and services share one runtime identity.
- A caller-facing request type and the schema that validates it are the same declaration, so they cannot disagree about field names, optionality, or discriminants.
- Every exported schema has an exported type, including the element types of collection responses.

## Decisions

- [ADR 0001: Session generations and retry ownership](docs/adr/0001-session-generations.md)
- [ADR 0002: Runtime and drift decoding policies](docs/adr/0002-decoding-policy.md)
- [ADR 0003: Descriptor-owned endpoint contracts](docs/adr/0003-request-descriptors.md)
