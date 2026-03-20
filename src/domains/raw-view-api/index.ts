import { Effect, Layer, ServiceMap } from "effect";
import { WebUntisHttp } from "../../internal/http.ts";
import type {
  HeaderParams,
  QueryParams,
  RequestPolicy,
} from "../../internal/request.ts";

export interface RawViewApiRequest {
  readonly query?: QueryParams | undefined;
  readonly headers?: HeaderParams | undefined;
  readonly policy?: RequestPolicy | undefined;
  readonly body?: unknown;
}

export interface RawViewApiClientShape {
  readonly getJson: (
    path: string,
    options?: RawViewApiRequest,
  ) => ReturnType<WebUntisHttp["Service"]["getJson"]>;
  readonly get: (
    path: string,
    options?: RawViewApiRequest,
  ) => ReturnType<WebUntisHttp["Service"]["get"]>;
  readonly postJson: (
    path: string,
    options?: RawViewApiRequest,
  ) => ReturnType<WebUntisHttp["Service"]["postJson"]>;
  readonly post: (
    path: string,
    options?: RawViewApiRequest,
  ) => ReturnType<WebUntisHttp["Service"]["post"]>;
  readonly putJson: (
    path: string,
    options?: RawViewApiRequest,
  ) => ReturnType<WebUntisHttp["Service"]["putJson"]>;
  readonly put: (
    path: string,
    options?: RawViewApiRequest,
  ) => ReturnType<WebUntisHttp["Service"]["put"]>;
}

export class RawViewApiClient extends ServiceMap.Service<
  RawViewApiClient,
  RawViewApiClientShape
>()("webuntis/internal/RawViewApiClient") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return RawViewApiClient.of({
        getJson: (path, options) => http.getJson(path, options),
        get: (path, options) => http.get(path, options),
        postJson: (path, options) => http.postJson(path, options),
        post: (path, options) => http.post(path, options),
        putJson: (path, options) => http.putJson(path, options),
        put: (path, options) => http.put(path, options),
      });
    }),
  );

  static readonly layer = this.layerNoDeps;
}
