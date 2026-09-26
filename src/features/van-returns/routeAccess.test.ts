import { describe, expect, it } from "vitest";
import { isRoleAllowed } from "@/auth/roleAccess";

describe("van return routes", () => {
  it("lets reps, agency operators and admins read van returns", () => {
    for (const role of ["SalesRep", "AgencyOperator", "CompanyAdmin"] as const) {
      expect(isRoleAllowed("/van-returns", role)).toBe(true);
      expect(isRoleAllowed("/van-returns/v-1", role)).toBe(true);
    }
    expect(isRoleAllowed("/van-returns", "ShopOwner")).toBe(false);
    expect(isRoleAllowed("/van-returns/v-1", "ShopOwner")).toBe(false);
  });

  it("lets only a rep declare a return", () => {
    expect(isRoleAllowed("/van-returns/new", "SalesRep")).toBe(true);
    expect(isRoleAllowed("/van-returns/new", "AgencyOperator")).toBe(false);
  });
});
