import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";
import { CalendarEntryTodayEntriesSchema, type CalendarEntryTodayEntries } from "./schemas.ts";

export type CalendarEntryTodayRequest =
  | {
    readonly startDate: string;
    readonly endDate: string;
    readonly classId: number;
  }
  | {
    readonly startDate: string;
    readonly endDate: string;
    readonly studentId: number;
  }
  | {
    readonly startDate: string;
    readonly endDate: string;
    readonly teacherId: number;
  };

export interface CalendarEntryClient {
  readonly getTodayEntries: (request: CalendarEntryTodayRequest) => Effect.Effect<CalendarEntryTodayEntries, unknown>;
}

export const makeCalendarEntryClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getTodayEntries: (request: CalendarEntryTodayRequest) =>
      http.getSchema("api/rest/view/v1/calendar-entry-today/", CalendarEntryTodayEntriesSchema, {
        query: {
          startDate: request.startDate,
          endDate: request.endDate,
          classId: "classId" in request ? request.classId : undefined,
          studentId: "studentId" in request ? request.studentId : undefined,
          teacherId: "teacherId" in request ? request.teacherId : undefined
        },
        withSchoolYearHeader: false
      })
  } satisfies CalendarEntryClient;
});
