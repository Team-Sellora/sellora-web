// Holds the current access token in memory so the HTTP client (which lives
// outside React) can read it at request time. Updated by the auth layer.
let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}
