import { describe, expect, it } from "vitest";
import { canCreateOrder, emptyOrdersMessage, orderColumnsFor } from "./roleView";

describe("order list role view", () => {
  it("hides shop and agency columns from a shop owner", () => {
    const columns = orderColumnsFor("ShopOwner");

    expect(columns).not.toContain("shop");
    expect(columns).not.toContain("agency");
    expect(columns).not.toContain("salesRep");
  });

  it("does not show a rep their own name column", () => {
    expect(orderColumnsFor("SalesRep")).not.toContain("salesRep");
  });

  it("shows the agency only to roles that span agencies", () => {
    expect(orderColumnsFor("CompanyAdmin")).toContain("agency");
    expect(orderColumnsFor("AreaManager")).toContain("agency");
    expect(orderColumnsFor("AgencyOperator")).not.toContain("agency");
  });

  it("lets only sales reps create orders", () => {
    expect(canCreateOrder("SalesRep")).toBe(true);
    expect(canCreateOrder("CompanyAdmin")).toBe(false);
    expect(canCreateOrder(null)).toBe(false);
  });

  it("gives each role its own empty-state message", () => {
    expect(emptyOrdersMessage("SalesRep")).toMatch(/you haven't placed/i);
    expect(emptyOrdersMessage("ShopOwner")).toMatch(/your shop/);
  });

  it("shows the cash sale vs delivery split to every role", () => {
    for (const role of [
      "CompanyAdmin",
      "AreaManager",
      "AgencyOperator",
      "SalesRep",
      "ShopOwner",
    ] as const) {
      expect(orderColumnsFor(role)).toContain("fulfilment");
    }
  });
});
