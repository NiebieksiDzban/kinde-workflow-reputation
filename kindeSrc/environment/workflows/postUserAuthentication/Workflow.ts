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
  },
};

export default async function Workflow(event: onPostAuthenticationEvent) {
  const isNewKindeUser = event.context.auth.isNewUserRecordCreated;

  if (!isNewKindeUser) {
    console.log("Not a new user — skipping Twitch username update.");
    return;
  }

  const fetch = event.context.fetch;
  const userId = event.context.user.id;

  // 1) Fetch linked identities
  const identitiesRes = await fetch({
    method: "GET",
    endpoint: `users/${userId}/identities`,
  });

  const identities = identitiesRes?.data?.identities || [];
  const twitchIdentity = identities.find(
      (id: any) => id.name === "twitch"
  );

  if (!twitchIdentity) {
    console.log("No Twitch identity found for user:", userId);
    return;
  }

  const twitchUsername = twitchIdentity.identity_data?.username;

  if (!twitchUsername) {
    console.log("Twitch username object is missing username field");
    return;
  }

  console.log(
      `Updating preferred_username to ${twitchUsername} for user ${userId}`
  );

  await fetch({
    method: "PATCH",
    endpoint: `users/${userId}`,
    body: { preferred_username: twitchUsername },
  });

  console.log("Update complete.");
}
