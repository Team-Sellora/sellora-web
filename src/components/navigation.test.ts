import { describe, expect, it } from "vitest";
import { isRoleAllowed, routeAccess } from "@/auth/roleAccess";
import type { SelloraRole } from "@/auth/useSelloraAuth";
import { navSections, navigationFor } from "./navigation";

const labels = (role: SelloraRole | null) =>
  navigationFor(role).flatMap((section) => section.items.map((item) => item.label));

describe("role-based navigation", () => {
  it("shows a company admin the network, people, catalogue, sales and admin screens", () => {
    expect(labels("CompanyAdmin")).toEqual([
      "Dashboard",
      "Provinces",
      "Area Managers",
      "Hierarchy roll-up",
      "Team",
      "Products",
      "Product categories",
      "Inventory",
      "Orders",
      "Van returns",
      "Failed notifications",
    ]);
  });

  it("shows an area manager agencies, territories and assignments", () => {
    expect(labels("AreaManager")).toEqual([
      "Dashboard",
      "Agencies",
      "Territories",
      "Assign territories",
      "Products",
      "Orders",
    ]);
  });

  it("shows an agency operator their shops, team, stock and orders", () => {
    expect(labels("AgencyOperator")).toEqual([
      "Dashboard",
      "Shops",
      "Team",
      "Sales Reps",
      "Products",
      "Inventory",
      "Orders",
      "Van returns",
    ]);
  });

  it("shows a sales rep what they sell, carry and return", () => {
    expect(labels("SalesRep")).toEqual([
      "Dashboard",
      "Products",
      "Inventory",
      "Orders",
      "Van returns",
    ]);
  });

  it("shows a shop owner only their orders", () => {
    expect(labels("ShopOwner")).toEqual(["Dashboard", "Orders"]);
  });

  it("shows only the dashboard until the role is known", () => {
    expect(labels(null)).toEqual(["Dashboard"]);
  });

  it("drops sections a role has nothing in", () => {
    expect(navigationFor("ShopOwner").map((section) => section.title)).toEqual([null, "Sales"]);
  });

  it("has an explicit access rule for every screen in the menu", () => {
    // Without one, isRoleAllowed falls back to "allow" and the item would show to everyone.
    const screens = navSections
      .flatMap((section) => section.items)
      .filter((item) => item.to !== "/");

    for (const item of screens) {
      expect(routeAccess[item.to], `${item.to} needs a routeAccess entry`).toBeDefined();
    }
  });

  it("never shows a link the route guard would refuse", () => {
    const roles: SelloraRole[] = [
      "CompanyAdmin",
      "AreaManager",
      "AgencyOperator",
      "SalesRep",
      "ShopOwner",
    ];

    for (const role of roles) {
      for (const item of navigationFor(role).flatMap((section) => section.items)) {
        expect(isRoleAllowed(item.to, role), `${role} → ${item.to}`).toBe(true);
      }
    }
  });
});
