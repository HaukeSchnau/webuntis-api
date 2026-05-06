import { Context, Effect, Layer } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import type { Schoolyear } from "../shared/schema.ts";
import { SchoolyearsRequests } from "./requests.ts";

export interface SchoolyearsClientShape {
  readonly list: () => Effect.Effect<ReadonlyArray<Schoolyear>, RequestFailure>;
}

export class SchoolyearsClient extends Context.Service<SchoolyearsClient, SchoolyearsClientShape>()(
  "webuntis/SchoolyearsClient",
) {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return SchoolyearsClient.of({
        list: Effect.fn("SchoolyearsClient.list")(function* () {
          return yield* http.requestSchema(SchoolyearsRequests.list, undefined);
        }),
      });
    }),
  );
}
