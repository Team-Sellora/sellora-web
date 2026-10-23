import { describe, expect, it } from "vitest";
import type { HierarchyRollUpProvince } from "@/features/hierarchy/api";
import type { StockItem } from "@/features/inventory/types";
import type { OrderSummary } from "@/features/orders/types";
import {
  attentionItems,
  lowStockItems,
  networkTotals,
  provincesByAttention,
  statusMix,
} from "./metrics";

const province = (overrides: Partial<HierarchyRollUpProvince>): HierarchyRollUpProvince => ({
  provinceId: "p",
  code: "WP",
  name: "Western",
  status: "Active",
  currentManager: { staffProfileId: "m", displayName: "Manager" },
  agencyCount: 0,
  territoryCount: 0,
  shopCount: 0,
  unassignedTerritoryCount: 0,
  hasUnassignedTerritories: false,
  ...overrides,
});

describe("dashboard metrics", () => {
  it("adds up the company network from the roll-up", () => {
    const totals = networkTotals([
      province({ agencyCount: 3, territoryCount: 10, shopCount: 400, unassignedTerritoryCount: 1 }),
      province({ agencyCount: 2, territoryCount: 6, shopCount: 150, currentManager: null }),
    ]);

    expect(totals).toEqual({
      provinces: 2,
      agencies: 5,
      territories: 16,
      shops: 550,
      unassignedTerritories: 1,
      provincesWithoutManager: 1,
    });
  });

  it("lists provinces with gaps first", () => {
    const ordered = provincesByAttention([
      province({ name: "Big", shopCount: 900 }),
      province({ name: "No manager", currentManager: null }),
      province({ name: "Gap", unassignedTerritoryCount: 2 }),
    ]);

    expect(ordered.map((p) => p.name)).toEqual(["No manager", "Gap", "Big"]);
  });

  it("only raises exceptions that exist, each linking to its fix", () => {
    const items = attentionItems({
      totals: networkTotals([province({ unassignedTerritoryCount: 2 })]),
      ordersAwaitingApproval: 1,
      vanReturnsAwaitingCount: 0,
      lowStockCount: null,
    });

    expect(items.map((item) => [item.id, item.count, item.to])).toEqual([
      ["unassigned-territories", 2, "/hierarchy-roll-up"],
      ["orders-awaiting-approval", 1, "/orders"],
    ]);
    expect(items[0]!.label).toBe("2 territories are not assigned to an agency");
    expect(items[1]!.label).toBe("1 recent order is waiting for agency approval");
  });

  it("returns nothing when all is well", () => {
    expect(
      attentionItems({
        totals: networkTotals([province({})]),
        ordersAwaitingApproval: 0,
        vanReturnsAwaitingCount: 0,
        lowStockCount: 0,
      }),
    ).toEqual([]);
  });

  it("counts statuses of recent orders, largest first", () => {
    const orders = ["Confirmed", "PendingApproval", "Confirmed"].map(
      (status) => ({ status }) as OrderSummary,
    );

    expect(statusMix(orders)).toEqual([
      { status: "Confirmed", count: 2 },
      { status: "PendingApproval", count: 1 },
    ]);
  });

  it("uses Inventory's low-stock rule: available below the threshold", () => {
    const item = (available: number, threshold: number | null) =>
      ({ availableQuantity: available, reorderThreshold: threshold }) as StockItem;

    expect(lowStockItems([item(4, 5), item(5, 5), item(9, null), item(0, 1)])).toHaveLength(2);
  });
});
