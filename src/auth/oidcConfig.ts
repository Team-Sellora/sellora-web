import type { UserManagerSettings } from "oidc-client-ts";
import { InMemoryWebStorage, WebStorageStateStore } from "oidc-client-ts";
import { env } from "@/config/env";

export const oidcConfig: UserManagerSettings = {
  authority: `${env.isBaseUrl}/oauth2/token`,
  metadataUrl: `${env.isBaseUrl}/oauth2/token/.well-known/openid-configuration`,
  client_id: env.oidcClientId,
  redirect_uri: env.appOrigin,
  post_logout_redirect_uri: env.appOrigin,
  response_type: "code",
  scope: "openid profile roles",
  automaticSilentRenew: true,
  // Token held in memory only (not localStorage/sessionStorage), per CSP-44.
  // Cleared on refresh; silent renewal (CSP-45) restores it from the still-
  // valid Identity Server session.
  userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
};