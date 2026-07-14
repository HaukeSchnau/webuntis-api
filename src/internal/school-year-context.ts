import { Context, Effect } from "effect";

export const CurrentSchoolYearId = Context.Reference<number | undefined>(
  "webuntis/internal/CurrentSchoolYearId",
  {
    defaultValue: () => undefined,
  },
);

export type SchoolYearScope = <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;

export const withSchoolYear = (schoolYearId: number): SchoolYearScope =>
  Effect.provideService(CurrentSchoolYearId, schoolYearId);
