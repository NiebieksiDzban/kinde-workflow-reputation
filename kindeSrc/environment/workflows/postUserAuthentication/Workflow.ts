import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
  createKindeAPI,
} from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "setPreferredUsernameFromTwitch",
  name: "Set preferred_username from Twitch",
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.mfa": {},
    "kinde.fetch": {},
    "kinde.env": {},
    "kinde.auth": {},
    "url": {},
    console: {},
  },
};

export default async function Workflow(event: onPostAuthenticationEvent) {
  const isNewKindeUser = event.context.auth.isNewUserRecordCreated;

  if (isNewKindeUser) {
    const kindeApi = await createKindeAPI(event);
    const userId = event.context.user.id;

    // Get user identities to find Twitch username
    const { data: identitiesResponse } = await kindeApi.get({
      endpoint: `users/${userId}/identities`,
    });

    const twitchIdentity = identitiesResponse?.identities?.find(
      (i: any) => i.name === "twitch"
    );

    if (twitchIdentity) {
      const twitchUsername = twitchIdentity.identity_data?.username;

      if (twitchUsername) {
        console.log(`Updating preferred_username to ${twitchUsername} for user ${userId}`);
        await kindeApi.patch({
          endpoint: `users/${userId}`,
          params: {
            preferred_username: twitchUsername,
          },
        });
      } else {
        console.log("Twitch username not found in identity data");
      }
    } else {
      console.log("No Twitch identity found for the user");
    }
  }
}
