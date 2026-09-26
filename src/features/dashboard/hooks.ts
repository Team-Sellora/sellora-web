import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { fetchHierarchyRollUp } from "@/features/hierarchy/api";
import { fetchStock } from "@/features/inventory/api";
import { fetchOrders } from "@/features/orders/api";
import { fetchProducts } from "@/features/products/api";
import { fetchVanReturns } from "@/features/van-returns/api";
import { lowStockItems } from "./metrics";
import {
  DASHBOARD_GC_MS,
  DASHBOARD_STALE_MS,
  REFRESH_COOLDOWN_MS,
  retryDelay,
  shouldRetry,
} from "./queryPolicy";
import { dashboardLimiter } from "./requestLimiter";
import { readSnapshot, snapshotKey, writeSnapshot } from "./snapshotCache";

export const dashboardQueryKey = (companyId: string | null) => ["dashboard", companyId] as const;

/**
 * One dashboard widget's data: tenant-keyed, served from a fresh snapshot
 * when there is one, fetched through the shared limiter when there isn't.
 */
function useDashboardQuery<T>(widget: string, fetcher: () => Promise<T>, enabled: boolean) {
  const { companyId, username } = useSelloraAuth();
  const key = companyId && username ? snapshotKey(companyId, username, widget) : null;
  const snapshot = useMemo(() => (key ? readSnapshot<T>(key) : undefined), [key]);

  const query = useQuery<T>({
    // The company is part of the key: another tenant's answer can never be reused.
    queryKey: [...dashboardQueryKey(companyId), widget],
    queryFn: () => dashboardLimiter.run(fetcher),
    enabled: enabled && key !== null,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: DASHBOARD_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: shouldRetry,
    retryDelay,
    initialData: () => snapshot?.data,
    initialDataUpdatedAt: () => snapshot?.savedAt,
  });

  useEffect(() => {
    if (key && query.data !== undefined && query.dataUpdatedAt > (snapshot?.savedAt ?? 0)) {
      writeSnapshot(key, query.data, query.dataUpdatedAt);
    }
  }, [key, query.data, query.dataUpdatedAt, snapshot?.savedAt]);

  return query;
}

// ── Tier 1: above the fold, loaded immediately (2 requests) ──────────────

/** Organization: one row per province with counts — the whole network in one call. */
export function useNetworkRollUp(enabled: boolean) {
  return useDashboardQuery("roll-up", fetchHierarchyRollUp, enabled);
}

/** Order: total order count plus the latest 20 for the activity list. */
export function useRecentOrders(enabled: boolean) {
  return useDashboardQuery(
    "recent-orders",
    async () => {
      const page = await fetchOrders({ page: 1, pageSize: 20 });
      return { totalCount: page.totalCount, items: page.items };
    },
    enabled,
  );
}

// ── Tier 2: below the fold, loaded only once scrolled into view ──────────

/** Catalog: number of active products (one row requested; only the total is used). */
export function useActiveProductCount(enabled: boolean) {
  return useDashboardQuery(
    "active-products",
    async () => (await fetchProducts({ page: 1, pageSize: 1, status: "Active" })).totalCount,
    enabled,
  );
}

/** Order: van returns waiting for the agency to count them. */
export function usePendingVanReturnCount(enabled: boolean) {
  return useDashboardQuery(
    "pending-van-returns",
    async () => (await fetchVanReturns({ page: 1, pageSize: 1, status: "Declared" })).totalCount,
    enabled,
  );
}

/**
 * Inventory: the stock list is the heaviest call, so it is the last to load
 * and only the low-stock summary is kept (and cached), not the full list.
 */
export function useLowStock(enabled: boolean) {
  return useDashboardQuery(
    "low-stock",
    async () => {
      const low = lowStockItems(await fetchStock({}));
      return {
        count: low.length,
        worst: [...low]
          .sort((a, b) => a.availableQuantity - b.availableQuantity)
          .slice(0, 5)
          .map((item) => ({
            stockItemId: item.stockItemId,
            productId: item.productId,
            ownerDisplayName: item.ownerDisplayName,
            availableQuantity: item.availableQuantity,
            reorderThreshold: item.reorderThreshold ?? 0,
          })),
      };
    },
    enabled,
  );
}

/**
 * Manual refresh with a cooldown, so repeated clicks cannot hammer the
 * services. Refetches only the widgets currently on screen (enabled).
 */
export function useDashboardRefresh() {
  const { companyId } = useSelloraAuth();
  const queryClient = useQueryClient();
  const [coolingDown, setCoolingDown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (coolingDown) return;
    setCoolingDown(true);
    timer.current = setTimeout(() => setCoolingDown(false), REFRESH_COOLDOWN_MS);
    await queryClient.invalidateQueries({ queryKey: dashboardQueryKey(companyId) });
  }, [coolingDown, companyId, queryClient]);

  return { refresh, coolingDown };
}

/**
 * True once the element has come within 200px of the viewport, and stays
 * true. Lets below-the-fold widgets wait until someone scrolls to them.
 */
export function useInView<T extends Element>(): [(node: T | null) => void, boolean] {
  const [inView, setInView] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      observer.current?.disconnect();
      if (!node || inView) return;

      if (typeof IntersectionObserver === "undefined") {
        setInView(true);
        return;
      }

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setInView(true);
            observer.current?.disconnect();
          }
        },
        { rootMargin: "200px" },
      );
      observer.current.observe(node);
    },
    [inView],
  );

  useEffect(() => () => observer.current?.disconnect(), []);

  return [ref, inView];
}
