import { env } from "@/config/env";
import { getAccessToken } from "./tokenStore";

/**
 * Single gateway HTTP client. Automatically attaches the bearer token to
 * every request, so callers never handle auth headers themselves.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Accept", "application/json");

  // path is relative to the gateway base, e.g. "/sellora/ref/1.0.0/test"
  const url = `${env.gatewayBaseUrl}${path}`;

  return fetch(url, { ...options, headers });
}