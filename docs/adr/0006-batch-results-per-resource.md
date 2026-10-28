# ADR 0006: Batches report per resource and can keep the raw body

Status: accepted

## Context

Since 2026-09-04 WebUntis accepts one resource per `timetable/entries` request, so a school-wide
import sends hundreds of requests. With `Effect.forEach`, the first refused resource or the
first response that fails to decode aborts the batch. That turned each upstream nullable-field
change into a stopped import until a release. Importers also want to keep everything WebUntis
sent, while runtime decoding (ADR 0002) strips fields the schema does not model.

## Decision

`TimetableClient.getEntriesForResources` validates the whole input once, then fetches each
resource and returns `{ resource, result, raw? }` in input order. `result` is an Effect
`Result`, so the batch effect itself only fails with `InvalidRequestError`.

`WebUntisHttp.requestDecoded` returns the parsed JSON body next to a `Result` of decoding it.
With `raw: true`, the batch keeps that body, so a caller can store a response even when its
decoding failed.

Concurrency defaults to 1, matching `Effect.forEach`. The connection's limits (ADR 0005) cap
it further.

## Consequences

An import keeps going past refused or drifting resources and can persist the original bodies
for later replay. Callers must inspect each result. Other endpoints can offer the same shape by
using `requestDecoded` when a need appears.
