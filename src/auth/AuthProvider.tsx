import { type ReactNode, useEffect, useState } from "react";
import { AuthProvider as OidcAuthProvider } from "react-oidc-context";
import type { User } from "oidc-client-ts";
import { oidcConfig } from "./oidcConfig";

function onSigninCallback(_user: User | void): void {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // On the server and the first hydration pass, render a neutral loading
  // shell. Nothing below calls useAuth() until the real provider is mounted,
  // so SSR never touches oidc-client-ts (which needs window).
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <OidcAuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
      {children}
    </OidcAuthProvider>
  );
}
