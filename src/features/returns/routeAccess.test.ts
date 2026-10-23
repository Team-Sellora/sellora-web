import { describe, expect, it } from "vitest";
import { isRoleAllowed } from "@/auth/roleAccess";

describe("shop return routes", () => {
  it("lets admins, area managers, operators, reps, and shop owners access shop returns list and details", () => {
    for (const role of [
      "CompanyAdmin",
      "AreaManager",
      "AgencyOperator",
      "SalesRep",
      "ShopOwner",
    ] as const) {
      expect(isRoleAllowed("/returns", role)).toBe(true);
      expect(isRoleAllowed("/returns/ret-123", role)).toBe(true);
    }
  });

  it("blocks unauthenticated users with no Sellora role", () => {
    expect(isRoleAllowed("/returns", null)).toBe(false);
    expect(isRoleAllowed("/returns/ret-123", null)).toBe(false);
  });
});
