import { Effect, Layer, ServiceMap } from "effect";
import type { RequestFailure } from "../../internal/http.ts";
import { WebUntisHttp } from "../../internal/http.ts";
import type { UserContactData, UserEmail } from "../schemas/profile.ts";
import { ProfileRequests } from "./requests.ts";

export interface ProfileClientShape {
  readonly getUserContactData: () => Effect.Effect<
    UserContactData,
    RequestFailure
  >;
  readonly getUserEmail: () => Effect.Effect<UserEmail, RequestFailure>;
}

export class ProfileClient extends ServiceMap.Service<
  ProfileClient,
  ProfileClientShape
>()("webuntis/ProfileClient") {
  static readonly layerNoDeps = Layer.effect(
    this,
    Effect.gen(function* () {
      const http = yield* WebUntisHttp;

      return ProfileClient.of({
        getUserContactData: Effect.fn("ProfileClient.getUserContactData")(
          function* () {
            return yield* http.requestSchema(
              ProfileRequests.getUserContactData,
              undefined,
            );
          },
        ),
        getUserEmail: Effect.fn("ProfileClient.getUserEmail")(function* () {
          return yield* http.requestSchema(
            ProfileRequests.getUserEmail,
            undefined,
          );
        }),
      });
    }),
  );
}
