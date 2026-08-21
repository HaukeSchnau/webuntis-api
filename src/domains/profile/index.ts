import { Context, Effect, Layer } from "effect";
import { makeOperations } from "../../internal/domain.ts";
import type { WebUntisError } from "../../internal/errors.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import { ProfileRequests } from "./requests.ts";
import type { UserContactData, UserEmail } from "./schema.ts";

export interface ProfileClientShape {
  readonly getUserContactData: Effect.Effect<UserContactData, WebUntisError>;
  readonly getUserEmail: Effect.Effect<UserEmail, WebUntisError>;
}

export class ProfileClient extends Context.Service<ProfileClient, ProfileClientShape>()(
  "webuntis/ProfileClient",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const { read } = makeOperations(yield* WebUntisHttp, "ProfileClient");

      return ProfileClient.of({
        getUserContactData: read("getUserContactData", ProfileRequests.getUserContactData),
        getUserEmail: read("getUserEmail", ProfileRequests.getUserEmail),
      });
    }),
  );
}
