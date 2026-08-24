import { type ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { useSelloraAuth } from "./useSelloraAuth";
import { isRoleAllowed } from "./roleAccess";

export function RouteGuard({ children }: Readonly<{ children: ReactNode }>) {
  const { role, isLoading } = useSelloraAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isRoleAllowed(location.pathname, role)) {
    return <Navigate to="/not-authorised" />;
  }

  return <>{children}</>;
}