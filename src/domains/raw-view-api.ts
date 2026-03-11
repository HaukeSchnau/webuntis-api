import { Effect } from "effect";
import { WebUntisHttp } from "../core/http.ts";

export interface RawViewApiRequest {
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly headers?: Readonly<Record<string, string | undefined>>;
  readonly withSchoolYearHeader?: boolean | undefined;
  readonly body?: unknown;
}

export const makeRawViewApiClient = Effect.gen(function*() {
  const http = yield* WebUntisHttp;

  return {
    getJson: (path: string, options?: RawViewApiRequest) => http.getJson(path, options),
    get: (path: string, options?: RawViewApiRequest) => http.get(path, options),
    postJson: (path: string, options?: RawViewApiRequest) => http.postJson(path, options),
    post: (path: string, options?: RawViewApiRequest) => http.post(path, options),
    putJson: (path: string, options?: RawViewApiRequest) => http.putJson(path, options),
    put: (path: string, options?: RawViewApiRequest) => http.put(path, options)
  };
});
