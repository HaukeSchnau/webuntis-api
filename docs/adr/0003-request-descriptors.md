# ADR 0003: Descriptor-owned endpoint contracts

Status: accepted

## Context

Duplicating path, query, validation, auth policy, and response-decoding logic across transport and domain layers makes endpoint changes repetitive and easy to desynchronize.

## Decision

Each endpoint has an explicit request descriptor that owns method, path, caller-input schema, query encoding, response schema, and auth policy. `WebUntisHttp` accepts descriptors only. Domain interfaces remain explicit rather than generated so the public API stays readable and deliberately curated.

Validation occurs at this trust boundary and reports `InvalidRequestError` before network activity.

The caller-facing request type is derived from the descriptor's input schema rather than written twice. Deriving it does not generate the public interface — the domain member is still declared by hand — it only removes the possibility that the declared shape and the validated shape disagree. Runtime refinements such as `IsoDate` stay invisible to the type, which is intentional: a branded date would leak validation into every call site.

Service implementations are assembled by `makeOperations` in `src/internal/domain.ts`, which derives span names from the owning service. The interface a consumer reads is still hand-written; only the mechanical body is shared.

## Consequences

One concept has one mechanical home, endpoint construction is testable without live IO, and public interfaces remain easy to navigate. Adding a route requires a descriptor, an explicit domain member, and construction/contract coverage. A descriptor whose response schema disagrees with its declared domain member fails to compile, because `Context.Service.of` checks the assembled service against the interface.
