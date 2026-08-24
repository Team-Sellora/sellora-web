import type { SelloraRole } from "./useSelloraAuth";

export const routeAccess: Record<string, SelloraRole[]> = {
  "/provinces": ["CompanyAdmin"],
  "/area-managers": ["CompanyAdmin"],
  "/agencies": ["CompanyAdmin", "AreaManager"],
  "/territories": ["CompanyAdmin", "AreaManager", "AgencyOperator"],
  "/sales-reps": ["CompanyAdmin", "AreaManager", "AgencyOperator"],
  "/shops": ["CompanyAdmin", "AreaManager", "AgencyOperator", "SalesRep"],
  "/inventory": ["CompanyAdmin", "AreaManager", "AgencyOperator"],
  "/orders": ["CompanyAdmin", "AreaManager", "AgencyOperator", "SalesRep"],
};

export function isRoleAllowed(path: string, role: SelloraRole | null): boolean {
  const allowed = routeAccess[path];
  if (!allowed) return true;
  if (!role) return false;
  return allowed.includes(role);
}
