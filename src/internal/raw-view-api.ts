import { Context, Effect, Layer } from "effect";
import { type RequestFailure, WebUntisHttp } from "./http.ts";
import {
  type HeaderParams,
  type QueryParams,
  request,
  RequestPolicy,
  type RequestPolicy as RequestPolicyType,
} from "./request.ts";

export interface RawViewApiRequest {
  readonly query?: QueryParams | undefined;
  readonly headers?: HeaderParams | undefined;
  readonly policy?: RequestPolicyType | undefined;
  readonly supportsSchoolYearScope?: boolean | undefined;
}

export interface RawViewApiClientShape {
  readonly getJson: (
    path: string,
    options?: RawViewApiRequest,
  ) => Effect.Effect<unknown, RequestFailure>;
}

export class RawViewApiClient extends Context.Service<RawViewApiClient, RawViewApiClientShape>()(
  "webuntis/internal/RawViewApiClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return RawViewApiClient.of({
        getJson: (path, options = {}) =>
          http.requestJson(
            request<void>({
              method: "GET",
              path,
              policy: options.policy ?? RequestPolicy.Metadata,
              query: () => options.query ?? {},
              headers: () => options.headers ?? {},
              supportsSchoolYearScope: options.supportsSchoolYearScope,
            }),
            undefined,
          ),
      });
    }),
  );
}
