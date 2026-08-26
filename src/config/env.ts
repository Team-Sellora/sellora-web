// Central place for all environment-derived values.
// Change deployment targets via .env — never hardcode URLs elsewhere.
function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  isBaseUrl: required(import.meta.env.VITE_IS_BASE_URL, "VITE_IS_BASE_URL"),
  gatewayBaseUrl: required(import.meta.env.VITE_GATEWAY_BASE_URL, "VITE_GATEWAY_BASE_URL"),
  oidcClientId: required(import.meta.env.VITE_OIDC_CLIENT_ID, "VITE_OIDC_CLIENT_ID"),
  appOrigin: required(import.meta.env.VITE_APP_ORIGIN, "VITE_APP_ORIGIN"),
} as const;
