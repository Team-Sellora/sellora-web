import { env } from "@/config/env";
import { getAccessToken } from "./tokenStore";

// Called when a request comes back 401 despite the token/renewal — the token
// was rejected, so send the user to log in again, preserving where they were.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

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

  const url = `${env.gatewayBaseUrl}${path}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token rejected — trigger the login redirect wired up by the auth layer.
    onUnauthorized?.();
  }

  return response;
}