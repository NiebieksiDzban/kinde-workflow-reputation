import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
} from "@kinde/infrastructure";

export const workflowSettings: WorkflowSettings = {
  id: "setPreferredUsernameFromTwitch",
  name: "Set preferred_username from Twitch",
  trigger: WorkflowTrigger.PostAuthentication,
  bindings: {
    "kinde.fetch": {},
    "kinde.auth": {},
    console: {},
    "kinde.mfa": {}
  },
};

type Identity = {
  name: string;
  identity_data?: { username?: string };
};

type IdentitiesResponse = { identities?: Identity[] };

export default async function Workflow(event: onPostAuthenticationEvent) {
  const isNewKindeUser = event.context.auth.isNewUserRecordCreated;
  if (!isNewKindeUser) return;

  const fetch = event.context.fetch;
  const userId = event.context.user.id;

  // Fetch user identities
  let identitiesResponse: IdentitiesResponse | undefined;
  try {
    identitiesResponse = await fetch({
      method: "GET",
      endpoint: `users/${userId}/identities`,
    });
  } catch (err) {
    console.log("Failed to fetch identities:", err);
    return;
  }

  if (!identitiesResponse?.identities?.length) {
    console.log("No identities found:", identitiesResponse);
    return;
  }

  const twitchIdentity = identitiesResponse.identities.find(
      (id) => id.name === "twitch"
  );

  if (!twitchIdentity?.identity_data?.username) {
    console.log("No Twitch username found:", twitchIdentity);
    return;
  }

  const twitchUsername = twitchIdentity.identity_data.username;

  console.log(`Updating preferred_username to ${twitchUsername} for user ${userId}`);

  try {
    await fetch({
      method: "PATCH",
      endpoint: `users/${userId}`,
      body: { preferred_username: twitchUsername },
    });
    console.log("preferred_username updated successfully");
  } catch (err) {
    console.log("Failed to update preferred_username:", err);
  }
}
