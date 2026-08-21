import { Context, Effect, Layer } from "effect";
import { makeOperations } from "../../internal/domain.ts";
import type { WebUntisError } from "../../internal/errors.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import type { Schoolyear } from "../shared/schema.ts";
import { SchoolyearsRequests } from "./requests.ts";

export interface SchoolyearsClientShape {
  readonly list: Effect.Effect<ReadonlyArray<Schoolyear>, WebUntisError>;
}

export class SchoolyearsClient extends Context.Service<SchoolyearsClient, SchoolyearsClientShape>()(
  "webuntis/SchoolyearsClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { read } = makeOperations(yield* WebUntisHttp, "SchoolyearsClient");

      return SchoolyearsClient.of({
        list: read("list", SchoolyearsRequests.list),
      });
    }),
  );
}
