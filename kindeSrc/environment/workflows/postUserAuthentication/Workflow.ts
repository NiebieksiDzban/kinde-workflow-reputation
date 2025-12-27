import {
  onPostAuthenticationEvent,
  WorkflowSettings,
  WorkflowTrigger,
} from "@kinde/infrastructure";

// setPreferredUsernameWorkflow.js

export const workflowSettings = {
  id: "setPreferredUsernameFromTwitch",
  name: "Set preferred_username from Twitch",
  trigger: "user:tokens_generation",
};

export default async function Workflow({ request, context, kinde }) {
  const user = context.user;
  const identities = user.identities || [];

  // Find Twitch identity (case may vary)
  const twitchIdentity = identities.find(
      (i) => i.type === "twitch"
  );

  if (!twitchIdentity) {
    return;
  }

  const twitchUsername =
      twitchIdentity.details?.preferred_username ||
      twitchIdentity.details?.login;

  if (!twitchUsername) {
    return;
  }

  // Only update if not already set
  if (!user.preferred_username) {
    await kinde.auth.updateUser({
      id: user.id,
      preferred_username: twitchUsername,
    });
  }
}
