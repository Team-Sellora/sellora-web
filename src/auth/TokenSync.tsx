import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { setAccessToken } from "@/api/tokenStore";

/**
 * Keeps the in-memory token store in sync with the OIDC auth state.
 * Renders nothing — it's a side-effect bridge between React auth and the
 * non-React HTTP client.
 */
export function TokenSync() {
  const auth = useAuth();

  useEffect(() => {
    setAccessToken(auth.user?.access_token ?? null);
  }, [auth.user?.access_token]);

  return null;
}