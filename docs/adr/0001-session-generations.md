# ADR 0001: Session generations and retry ownership

Status: accepted

## Context

Concurrent requests can observe 401 responses from different logins. Clearing session state unconditionally lets an old response destroy a newer valid session. Auth-only requests also need tenant identity on both their initial attempt and retry.

## Decision

Session state carries a monotonically increasing generation. Invalidation succeeds only when the response's expected generation still matches current state. The HTTP service owns one retry and resolves the same request policy before each attempt.

Authentication remains single-flight. Public auth operations expose completion only; tokens, cookies, and cached metadata stay internal.

## Consequences

Stale failures are harmless, retries remain bounded, and domain services do not coordinate authentication state. Deterministic concurrency tests protect the generation rule.
