import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  GitFork,
  Info,
  Map as MapIcon,
  MapPin,
  Package,
  RefreshCw,
  Store,
  Undo2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { isRoleAllowed } from "@/auth/roleAccess";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { formatLkr, formatOrderDate } from "@/features/orders/format";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import {
  useActiveProductCount,
  useDashboardRefresh,
  useInView,
  useLowStock,
  useNetworkRollUp,
  usePendingVanReturnCount,
  useRecentOrders,
} from "./hooks";
import { attentionItems, networkTotals, provincesByAttention, statusMix } from "./metrics";
import { httpStatusOf } from "./queryPolicy";

const count = (value: number) => value.toLocaleString("en-LK");

/**
 * Company overview for Company Admins, read top-down:
 *   1. five headline numbers, each a link to its page;
 *   2. what needs attention (exceptions only) beside the latest orders;
 *   3. the province breakdown;
 *   4. catalogue and stock, loaded last.
 * Other roles get a shortcut page instead, and no dashboard requests.
 */
export function DashboardPage() {
  const { role } = useSelloraAuth();

  return role === "CompanyAdmin" ? <CompanyAdminDashboard /> : <RoleHome />;
}

function CompanyAdminDashboard() {
  // Tier 1: two requests, to two different services.
  const rollUp = useNetworkRollUp(true);
  const orders = useRecentOrders(true);
  const tierOneSettled = !rollUp.isFetching && !orders.isFetching;

  // Tier 2 starts only after tier 1 has settled, and then either when the
  // section scrolls into view or after a short idle pause — never in the
  // same burst as tier 1.
  const [lowerRef, lowerInView] = useInView<HTMLDivElement>();
  const idle = useIdleAfter(tierOneSettled, 1500);
  const tierTwo = tierOneSettled && (lowerInView || idle);

  const products = useActiveProductCount(tierTwo);
  const vanReturns = usePendingVanReturnCount(tierTwo);
  const lowStock = useLowStock(tierTwo);

  const { refresh, coolingDown } = useDashboardRefresh();

  const totals = rollUp.data ? networkTotals(rollUp.data) : null;
  const recent = orders.data?.items ?? [];
  const attention = attentionItems({
    totals,
    ordersAwaitingApproval: orders.data
      ? recent.filter((order) => order.status === "PendingApproval").length
      : null,
    vanReturnsAwaitingCount: vanReturns.data ?? null,
    lowStockCount: lowStock.data?.count ?? null,
  });

  const updatedAt = Math.min(
    ...[rollUp.dataUpdatedAt, orders.dataUpdatedAt].filter((value) => value > 0),
  );
  const anyFetching = [rollUp, orders, products, vanReturns, lowStock].some((q) => q.isFetching);

  return (
    <>
      <PageHeader
        title="Company overview"
        description="Your company's distribution network, orders and stock at a glance."
        crumbs={[{ label: "Overview" }]}
        actions={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {Number.isFinite(updatedAt) && <UpdatedAgo at={updatedAt} />}
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={coolingDown || anyFetching}
              title={coolingDown ? "Refreshed recently — available again shortly" : "Refresh"}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-sm text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", anyFetching && "animate-spin")} />
              Refresh
            </button>
          </div>
        }
      />

      {/* 1. Headline numbers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="Orders"
          to="/orders"
          icon={ClipboardList}
          query={orders}
          value={(d) => d.totalCount}
        />
        <Kpi
          label="Shops"
          to="/hierarchy-roll-up"
          icon={Store}
          query={rollUp}
          value={() => totals?.shops}
        />
        <Kpi
          label="Agencies"
          to="/hierarchy-roll-up"
          icon={Building2}
          query={rollUp}
          value={() => totals?.agencies}
        />
        <Kpi
          label="Territories"
          to="/hierarchy-roll-up"
          icon={MapPin}
          query={rollUp}
          value={() => totals?.territories}
        />
        <Kpi
          label="Provinces"
          to="/provinces"
          icon={MapIcon}
          query={rollUp}
          value={() => totals?.provinces}
        />
      </div>

      {/* 2. Exceptions beside activity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel
          className="lg:col-span-2"
          title="Needs attention"
          subtitle="Only what someone should act on"
        >
          {rollUp.isLoading && orders.isLoading ? (
            <Skeleton lines={3} />
          ) : attention.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {tierTwo && !lowStock.isFetching && !vanReturns.isFetching
                ? "Nothing needs attention right now."
                : "Nothing so far — stock and van returns are still loading."}
            </p>
          ) : (
            <ul className="space-y-2">
              {attention.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.to as "/"}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/60",
                      item.tone === "warning"
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-border bg-card",
                    )}
                  >
                    {item.tone === "warning" ? (
                      <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                    ) : (
                      <Info className="size-4 shrink-0 text-primary" />
                    )}
                    <span className="flex-1">{item.label}</span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <WidgetError query={rollUp} what="Network figures" />
        </Panel>

        <Panel
          className="lg:col-span-3"
          title="Latest orders"
          subtitle="The 8 most recent, with the status mix of the latest 20"
          action={<ViewAll to="/orders" />}
        >
          {orders.isLoading ? (
            <Skeleton lines={5} />
          ) : recent.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {statusMix(recent).map((entry) => (
                  <span key={entry.status} className="inline-flex items-center gap-1.5 text-xs">
                    <OrderStatusBadge status={entry.status} />
                    <strong>{entry.count}</strong>
                  </span>
                ))}
              </div>
              <ul className="divide-y divide-border">
                {recent.slice(0, 8).map((order) => (
                  <li key={order.orderId} className="flex items-center gap-3 py-2 text-sm">
                    <Link
                      to="/orders/$orderId"
                      params={{ orderId: order.orderId }}
                      className="font-mono text-xs font-semibold hover:text-primary hover:underline"
                    >
                      {order.orderReference}
                    </Link>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {formatOrderDate(order.orderDate)}
                    </span>
                    <span className="ml-auto tabular-nums">{formatLkr(order.total)}</span>
                    <OrderStatusBadge status={order.status} />
                  </li>
                ))}
              </ul>
            </>
          )}
          <WidgetError query={orders} what="Orders" />
        </Panel>
      </div>

      {/* 3. Where the network is */}
      <Panel
        className="mt-4"
        title="Provinces"
        subtitle="Gaps first: provinces without a manager or with unassigned territories"
        action={<ViewAll to="/hierarchy-roll-up" label="Hierarchy roll-up" />}
      >
        {rollUp.isLoading ? (
          <Skeleton lines={4} />
        ) : !rollUp.data || rollUp.data.length === 0 ? (
          <Empty>No provinces yet. Start by adding one under Provinces.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Province</th>
                  <th className="py-2 pr-3">Area manager</th>
                  <th className="py-2 pr-3 text-right">Agencies</th>
                  <th className="py-2 pr-3 text-right">Territories</th>
                  <th className="py-2 pr-3 text-right">Shops</th>
                  <th className="py-2 text-right">Unassigned</th>
                </tr>
              </thead>
              <tbody>
                {provincesByAttention(rollUp.data).map((province) => (
                  <tr key={province.provinceId} className="border-t border-border">
                    <td className="py-2 pr-3 font-medium">
                      {province.name}{" "}
                      <span className="text-xs text-muted-foreground">{province.code}</span>
                    </td>
                    <td className="py-2 pr-3">
                      {province.currentManager?.displayName ?? (
                        <span className="text-amber-700 dark:text-amber-400">Not assigned</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {count(province.agencyCount)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {count(province.territoryCount)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {count(province.shopCount)}
                    </td>
                    <td
                      className={cn(
                        "py-2 text-right tabular-nums",
                        province.unassignedTerritoryCount > 0 &&
                          "font-semibold text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {count(province.unassignedTerritoryCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* 4. Catalogue and stock — loaded last */}
      <div ref={lowerRef} className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Catalogue" subtitle="Active products" action={<ViewAll to="/products" />}>
          <BigNumber query={products} icon={Package} />
        </Panel>
        <Panel
          title="Van returns"
          subtitle="Waiting to be counted by agencies"
          action={<ViewAll to="/van-returns" />}
        >
          <BigNumber query={vanReturns} icon={Undo2} />
        </Panel>
        <Panel
          title="Low stock"
          subtitle="Available below the reorder threshold"
          action={<ViewAll to="/inventory" />}
        >
          {!tierTwo || lowStock.isLoading ? (
            <Skeleton lines={2} />
          ) : lowStock.data ? (
            <>
              <div className="flex items-center gap-2 text-3xl font-semibold tabular-nums">
                <Boxes className="size-5 text-muted-foreground" />
                {count(lowStock.data.count)}
              </div>
              {lowStock.data.worst.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs">
                  {lowStock.data.worst.map((item) => (
                    <li key={item.stockItemId} className="flex justify-between gap-2">
                      <span className="truncate">{item.ownerDisplayName}</span>
                      <span className="tabular-nums text-amber-700 dark:text-amber-400">
                        {item.availableQuantity} / {item.reorderThreshold}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
          <WidgetError query={lowStock} what="Stock" />
        </Panel>
      </div>

      <QuickActions
        className="mt-4"
        links={[
          { to: "/hierarchy-roll-up", label: "Hierarchy roll-up", icon: GitFork },
          { to: "/provinces", label: "Provinces & area managers", icon: MapIcon },
          { to: "/staff", label: "Add team members", icon: UserPlus },
          { to: "/products", label: "Products", icon: Package },
        ]}
      />
    </>
  );
}

/** Non-admin roles: shortcuts to their own pages, and no dashboard requests. */
function RoleHome() {
  const { role } = useSelloraAuth();
  const links = [
    { to: "/orders", label: "Orders", icon: ClipboardList },
    { to: "/orders/new", label: "Place an order", icon: ClipboardList },
    { to: "/van-returns", label: "Van returns", icon: Undo2 },
    { to: "/inventory", label: "Inventory", icon: Boxes },
    { to: "/shops", label: "Shops", icon: Store },
    { to: "/agencies", label: "Agencies", icon: Building2 },
    { to: "/territories", label: "Territories", icon: MapPin },
    { to: "/products", label: "Products", icon: Package },
  ].filter((link) => isRoleAllowed(link.to, role));

  return (
    <>
      <PageHeader
        title="Welcome"
        description="Jump straight into your work."
        crumbs={[{ label: "Home" }]}
      />
      <QuickActions links={links} />
    </>
  );
}

// ── Building blocks ──────────────────────────────────────────────────────

interface QueryLike<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

function Kpi<T>({
  label,
  to,
  icon: Icon,
  query,
  value,
}: Readonly<{
  label: string;
  to: string;
  icon: LucideIcon;
  query: QueryLike<T>;
  value: (data: T) => number | undefined;
}>) {
  const resolved = query.data !== undefined ? value(query.data) : undefined;

  return (
    <Link
      to={to as "/"}
      className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">
        {query.isLoading ? (
          <span
            className="inline-block h-8 w-16 animate-pulse rounded bg-muted"
            aria-label="Loading"
          />
        ) : resolved !== undefined ? (
          count(resolved)
        ) : (
          <span className="text-muted-foreground" title="Could not be loaded">
            —
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
        Open <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}

function BigNumber({
  query,
  icon: Icon,
}: Readonly<{ query: QueryLike<number>; icon: LucideIcon }>) {
  if (query.isLoading || (query.data === undefined && !query.isError)) {
    return <Skeleton lines={1} />;
  }

  return (
    <>
      <div className="flex items-center gap-2 text-3xl font-semibold tabular-nums">
        <Icon className="size-5 text-muted-foreground" />
        {query.data !== undefined ? count(query.data) : "—"}
      </div>
      <WidgetError query={query} what="This figure" />
    </>
  );
}

function Panel({
  title,
  subtitle,
  action,
  className,
  children,
}: Readonly<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string | undefined;
  children: ReactNode;
}>) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function ViewAll({ to, label = "View all" }: Readonly<{ to: string; label?: string }>) {
  return (
    <Link
      to={to as "/"}
      className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
    >
      {label} <ArrowRight className="size-3" />
    </Link>
  );
}

/** One widget failing never blanks the page; it says which part is missing and why. */
function WidgetError({ query, what }: Readonly<{ query: QueryLike<unknown>; what: string }>) {
  if (!query.isError) return null;
  const status = httpStatusOf(query.error);
  const reason =
    status === 403
      ? "your account is not allowed to see it"
      : status === 401
        ? "your session needs to be renewed"
        : "the service did not answer — try Refresh in a moment";

  return (
    <p className="mt-2 text-xs text-destructive">
      {what} could not be loaded: {reason}.
    </p>
  );
}

function Skeleton({ lines }: Readonly<{ lines: number }>) {
  return (
    <div className="space-y-2" aria-label="Loading">
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded bg-muted"
          style={{ width: `${90 - index * 12}%` }}
        />
      ))}
    </div>
  );
}

function Empty({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{children}</p>;
}

function QuickActions({
  links,
  className,
}: Readonly<{
  links: Array<{ to: string; label: string; icon: LucideIcon }>;
  className?: string | undefined;
}>) {
  return (
    <Panel className={className} title="Quick actions">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <Link key={link.to} to={link.to as "/"} className="dashboard-shortcut">
            <link.icon size={18} />
            <span>{link.label}</span>
            <ArrowRight size={16} />
          </Link>
        ))}
      </div>
    </Panel>
  );
}

/** "Updated 3 min ago", ticking every 30 seconds. */
function UpdatedAgo({ at }: Readonly<{ at: number }>) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.max(0, Math.floor((now - at) / 60_000));
  return <span>Updated {minutes === 0 ? "just now" : `${minutes} min ago`}</span>;
}

/** True once `ready` has held for `delayMs` (a short pause after tier 1). */
function useIdleAfter(ready: boolean, delayMs: number): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!ready || idle) return;
    const timer = setTimeout(() => setIdle(true), delayMs);
    return () => clearTimeout(timer);
  }, [ready, idle, delayMs]);

  return idle;
}
