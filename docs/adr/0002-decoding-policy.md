# ADR 0002: Runtime and drift decoding policies

Status: accepted

## Context

WebUntis frequently adds response properties. Rejecting every additive field in production turns compatible upstream evolution into an outage, while ignoring additions everywhere hides useful reverse-engineering evidence.

## Decision

Production response decoding ignores excess properties but still rejects missing or malformed modeled properties. Contract tests and targeted raw live probes use strict excess-property decoding. Public-client live snapshots verify real behavior but do not claim exhaustive additive-field detection because runtime decoding strips those fields.

Numeric response fields use finite-number schemas so `NaN` and infinities cannot enter the domain model.

## Consequences

Consumers remain resilient to additive changes, while maintainers still receive precise drift failures in verification. A strict-test failure is investigated rather than automatically accepted.
