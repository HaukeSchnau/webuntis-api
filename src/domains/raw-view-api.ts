import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";

export interface RawViewApiRequest {
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly headers?: Readonly<Record<string, string | undefined>>;
  readonly withSchoolYearHeader?: boolean | undefined;
}

export const makeRawViewApiClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getJson: (path: string, options?: RawViewApiRequest) => http.getJson(path, options),
    get: (path: string, options?: RawViewApiRequest) => http.get(path, options)
  };
});
