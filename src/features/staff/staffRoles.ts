import type { SelloraRole } from "@/auth/useSelloraAuth";
import type { StaffRole } from "@/features/hierarchy/api";

export const roleLabels: Record<StaffRole, string> = {
  CompanyAdmin: "Company Admin",
  AreaManager: "Area Manager",
  AgencyOperator: "Agency Operator",
  SalesRep: "Sales Rep",
};

/** Mirrors the server rule in StaffProvisioningService. */
export function creatableRoles(role: SelloraRole | null): StaffRole[] {
  if (role === "CompanyAdmin") return ["SalesRep", "AgencyOperator", "AreaManager", "CompanyAdmin"];
  if (role === "AgencyOperator") return ["SalesRep"];
  return [];
}
