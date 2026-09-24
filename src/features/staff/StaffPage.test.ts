import { describe, expect, it } from "vitest";
import { isRoleAllowed } from "@/auth/roleAccess";
import { creatableRoles } from "./staffRoles";

describe("adding staff", () => {
  it("matches the server rule for who may create whom", () => {
    expect(creatableRoles("CompanyAdmin")).toEqual([
      "SalesRep",
      "AgencyOperator",
      "AreaManager",
      "CompanyAdmin",
    ]);
    expect(creatableRoles("AgencyOperator")).toEqual(["SalesRep"]);
    expect(creatableRoles("SalesRep")).toEqual([]);
  });

  it("only admins and agency operators can open the Team page", () => {
    expect(isRoleAllowed("/staff", "CompanyAdmin")).toBe(true);
    expect(isRoleAllowed("/staff", "AgencyOperator")).toBe(true);
    expect(isRoleAllowed("/staff", "SalesRep")).toBe(false);
    expect(isRoleAllowed("/staff", "AreaManager")).toBe(false);
  });
});
