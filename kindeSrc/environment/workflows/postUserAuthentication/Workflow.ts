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
    "kinde.m2mToken": {},
    "kinde.fetch": {},
    "kinde.env": {},
    console: {},
    url: {},
  },
};

export default async function Workflow(event: onPostAuthenticationEvent) {
  const isNewKindeUser = event.context.auth.isNewUserRecordCreated;
  const userId = event.context.user.id;

  if (isNewKindeUser) {
    const kindeApi = await createKindeAPI(event);

    const twitchUsername = event.context.auth.provider.data.idToken.claims.preferred_username;
    console.log(`twitchUsername: ${twitchUsername}`);

    if (twitchUsername) {
      const res = await kindeApi.post({
        endpoint: `users/${userId}/identities`,
        params: {
          type: 'username',
          value: twitchUsername
        },
      });
      console.log(res);
      console.log(event.context.workflow);
    }
  }
}
