import { type ReactNode, useEffect, useState } from "react";
import { AuthProvider as OidcAuthProvider } from "react-oidc-context";
import type { User } from "oidc-client-ts";
import { oidcConfig } from "./oidcConfig";

// After the redirect back from Identity Server, strip the ?code&state params
// from the URL so the address bar is clean and a refresh doesn't re-trigger.
function onSigninCallback(_user: User | void): void {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <OidcAuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
      {children}
    </OidcAuthProvider>
  );
}