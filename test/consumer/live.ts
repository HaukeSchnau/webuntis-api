import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import {
  AuthClient,
  WebUntisClient,
  WebUntisConnection,
  webUntisLayer,
} from "@schnau/webuntis-api";

const layer = Layer.unwrap(Effect.map(WebUntisConnection.fromEnv, webUntisLayer)).pipe(
  Layer.provide(FetchHttpClient.layer),
);

const result = await Effect.runPromise(
  Effect.gen(function* () {
    const auth = yield* AuthClient;
    const client = yield* WebUntisClient;
    yield* auth.ensureAuthenticated;

    const appData = yield* client.app.getData;
    const schoolyears = yield* client.schoolyears.list;

    return {
      hasTenant: appData.tenant.id.length > 0,
      schoolyearCount: schoolyears.length,
    };
  }).pipe(Effect.provide(layer)),
);

if (!result.hasTenant || result.schoolyearCount === 0) {
  throw new Error("Packed live smoke returned an invalid tenant or no school years");
}

console.log(`packed live smoke passed (${result.schoolyearCount} school years)`);
