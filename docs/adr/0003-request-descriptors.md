# ADR 0003: Descriptor-owned endpoint contracts

Status: accepted

## Context

Duplicating path, query, validation, auth policy, and response-decoding logic across transport and domain layers makes endpoint changes repetitive and easy to desynchronize.

## Decision

Each endpoint has an explicit request descriptor that owns method, path, caller-input schema, query encoding, response schema, and auth policy. `WebUntisHttp` accepts descriptors only. Domain interfaces remain explicit rather than generated so the public API stays readable and deliberately curated.

Validation occurs at this trust boundary and reports `InvalidRequestError` before network activity.

## Consequences

One concept has one mechanical home, endpoint construction is testable without live IO, and public interfaces remain easy to navigate. Adding a route requires a descriptor, an explicit domain member, and construction/contract coverage.
