import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Map,
  UserCog,
  Building2,
  MapPin,
  Users,
  Store,
  Package,
  Boxes,
  ClipboardList,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { LogOut } from "lucide-react";

const navItems: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/provinces", label: "Provinces", icon: Map },
  { to: "/area-managers", label: "Area Managers", icon: UserCog },
  { to: "/agencies", label: "Agencies", icon: Building2 },
  { to: "/territories", label: "Territories", icon: MapPin },
  { to: "/sales-reps", label: "Sales Reps", icon: Users },
  { to: "/shops", label: "Shops", icon: Store },
  { to: "/products", label: "Products", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/orders", label: "Orders", icon: ClipboardList },
];

export function AppShell({ children }: { readonly children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);
  const { username, role, logout } = useSelloraAuth();

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex size-7 shrink-0 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
            S
          </div>
          {!collapsed && <span className="text-sm font-semibold tracking-tight">Sellora</span>}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/"}
              title={item.label}

              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive(item.to, item.exact)
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-3 border-t border-sidebar-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>

      <div className={cn("transition-[padding] duration-200", collapsed ? "pl-16" : "pl-60")}>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background px-6">
          <span className="text-sm font-semibold tracking-tight">
            Sellora <span className="font-normal text-muted-foreground">Management Console</span>
          </span>
          {/* Placeholder for the authenticated user (wired up via OIDC later) */}
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium">{username ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{role ?? "—"}</div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              title="Log out"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-4" />
              <span>Log out</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
