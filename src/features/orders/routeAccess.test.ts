import { describe, expect, it } from "vitest";
import { isRoleAllowed } from "@/auth/roleAccess";

describe("order route access", () => {
  it("only lets sales reps open the create-order screen", () => {
    expect(isRoleAllowed("/orders/new", "SalesRep")).toBe(true);
    expect(isRoleAllowed("/orders/new", "CompanyAdmin")).toBe(false);
    expect(isRoleAllowed("/orders/new", "ShopOwner")).toBe(false);
  });

  it("lets all five roles open the list and details", () => {
    for (const role of [
      "CompanyAdmin",
      "AreaManager",
      "AgencyOperator",
      "SalesRep",
      "ShopOwner",
    ] as const) {
      expect(isRoleAllowed("/orders", role)).toBe(true);
      expect(isRoleAllowed("/orders/3f2c8a1e-0000-0000-0000-000000000000", role)).toBe(true);
    }
  });

  it("blocks signed-in users with no Sellora role", () => {
    expect(isRoleAllowed("/orders", null)).toBe(false);
    expect(isRoleAllowed("/orders/abc", null)).toBe(false);
  });

  it("only lets sales reps open checkout", () => {
    const path = "/orders/3f2c8a1e-0000-0000-0000-000000000000/checkout";

    expect(isRoleAllowed(path, "SalesRep")).toBe(true);
    expect(isRoleAllowed(path, "CompanyAdmin")).toBe(false);
    expect(isRoleAllowed(path, "AgencyOperator")).toBe(false);
    expect(isRoleAllowed(path, "ShopOwner")).toBe(false);
  });
});
