/**
 * Public schema surface, published as `@schnau/webuntis-api/schemas`.
 *
 * Every response schema and its decoded type lives in a `src/domains/<domain>/schema.ts`
 * module, and all of them are re-exported here. Schemas that are implementation
 * details of the transport (bootstrap projections, discovery payloads) live under
 * `src/internal` and are deliberately unreachable from this entry point.
 */
export * from "./app/schema.ts";
export * from "./classreg/schema.ts";
export * from "./exams/schema.ts";
export * from "./messages/schema.ts";
export * from "./profile/schema.ts";
export * from "./session/schema.ts";
export * from "./shared/schema.ts";
export * from "./timetable/schema.ts";
