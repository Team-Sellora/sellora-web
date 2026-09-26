import type { HierarchyRollUpProvince } from "@/features/hierarchy/api";
import type { StockItem } from "@/features/inventory/types";
import type { OrderStatus, OrderSummary } from "@/features/orders/types";

export interface NetworkTotals {
  provinces: number;
  agencies: number;
  territories: number;
  shops: number;
  unassignedTerritories: number;
  provincesWithoutManager: number;
}

/** Company-wide totals from one roll-up response (one row per province). */
export function networkTotals(provinces: HierarchyRollUpProvince[]): NetworkTotals {
  return provinces.reduce<NetworkTotals>(
    (totals, province) => ({
      provinces: totals.provinces + 1,
      agencies: totals.agencies + province.agencyCount,
      territories: totals.territories + province.territoryCount,
      shops: totals.shops + province.shopCount,
      unassignedTerritories: totals.unassignedTerritories + province.unassignedTerritoryCount,
      provincesWithoutManager: totals.provincesWithoutManager + (province.currentManager ? 0 : 1),
    }),
    {
      provinces: 0,
      agencies: 0,
      territories: 0,
      shops: 0,
      unassignedTerritories: 0,
      provincesWithoutManager: 0,
    },
  );
}

/** Provinces ordered for the breakdown table: gaps first, then by size. */
export function provincesByAttention(
  provinces: HierarchyRollUpProvince[],
): HierarchyRollUpProvince[] {
  const score = (province: HierarchyRollUpProvince) =>
    (province.currentManager ? 0 : 2) + (province.unassignedTerritoryCount > 0 ? 1 : 0);

  return [...provinces].sort(
    (a, b) => score(b) - score(a) || b.shopCount - a.shopCount || a.name.localeCompare(b.name),
  );
}

export type AttentionTone = "warning" | "info";

export interface AttentionItem {
  id: string;
  tone: AttentionTone;
  count: number;
  label: string;
  to: string;
}

/**
 * The "needs attention" list: only exceptions an admin can act on, each
 * linking to where it is fixed. Zero counts are left out, so an empty list
 * means nothing needs attention. Counts that are not loaded yet are null.
 */
export function attentionItems(input: {
  totals: NetworkTotals | null;
  ordersAwaitingApproval: number | null;
  vanReturnsAwaitingCount: number | null;
  lowStockCount: number | null;
}): AttentionItem[] {
  const items: AttentionItem[] = [];
  const add = (item: AttentionItem) => {
    if (item.count > 0) items.push(item);
  };

  if (input.totals) {
    add({
      id: "no-manager",
      tone: "warning",
      count: input.totals.provincesWithoutManager,
      label:
        plural(input.totals.provincesWithoutManager, "province has", "provinces have") +
        " no area manager",
      to: "/provinces",
    });
    add({
      id: "unassigned-territories",
      tone: "warning",
      count: input.totals.unassignedTerritories,
      label:
        plural(input.totals.unassignedTerritories, "territory is", "territories are") +
        " not assigned to an agency",
      to: "/hierarchy-roll-up",
    });
  }

  if (input.ordersAwaitingApproval != null) {
    add({
      id: "orders-awaiting-approval",
      tone: "info",
      count: input.ordersAwaitingApproval,
      label:
        plural(input.ordersAwaitingApproval, "recent order is", "recent orders are") +
        " waiting for agency approval",
      to: "/orders",
    });
  }

  if (input.vanReturnsAwaitingCount != null) {
    add({
      id: "van-returns",
      tone: "info",
      count: input.vanReturnsAwaitingCount,
      label:
        plural(input.vanReturnsAwaitingCount, "van return is", "van returns are") +
        " waiting to be counted",
      to: "/van-returns",
    });
  }

  if (input.lowStockCount != null) {
    add({
      id: "low-stock",
      tone: "warning",
      count: input.lowStockCount,
      label:
        plural(input.lowStockCount, "stock item is", "stock items are") +
        " below the reorder threshold",
      to: "/inventory",
    });
  }

  return items;
}

/** Status counts across the given (recent) orders, largest first. */
export function statusMix(orders: OrderSummary[]): Array<{ status: OrderStatus; count: number }> {
  const counts = new Map<OrderStatus, number>();
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Same rule as Inventory's low-stock alert (LowStockDetectionService): an
 * item with a reorder threshold whose available quantity is below it.
 */
export function lowStockItems(stock: StockItem[]): StockItem[] {
  return stock.filter(
    (item) => item.reorderThreshold != null && item.availableQuantity < item.reorderThreshold,
  );
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
