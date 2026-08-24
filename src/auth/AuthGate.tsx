import { type ReactNode, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Button } from "@/components/ui/button";

export function AuthGate({ children }: Readonly<{ children: ReactNode }>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const auth = useAuth();

  // During SSR / before hydration, don't attempt auth-gated rendering.
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-foreground">Sign-in error</h1>
          <p className="mt-2 text-sm text-muted-foreground">{auth.error.message}</p>
          <Button className="mt-6" onClick={() => auth.signinRedirect()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sellora</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access the management console.
          </p>
          <Button className="mt-6 w-full" onClick={() => auth.signinRedirect()}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
