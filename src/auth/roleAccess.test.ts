import { describe, expect, it } from "vitest";
import { isRoleAllowed } from "./roleAccess";

describe("product category route access", () => {
  it.each(["CompanyAdmin", "AreaManager", "AgencyOperator", "SalesRep"] as const)(
    "allows %s to view product categories",
    (role) => {
      expect(isRoleAllowed("/product-categories", role)).toBe(true);
    },
  );

  it("does not allow roles without category read access", () => {
    expect(isRoleAllowed("/product-categories", "ShopOwner")).toBe(false);
    expect(isRoleAllowed("/product-categories", null)).toBe(false);
  });
});
