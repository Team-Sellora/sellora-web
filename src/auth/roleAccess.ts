import type { SelloraRole } from "./useSelloraAuth";

export const routeAccess: Record<string, SelloraRole[]> = {
  "/provinces": ["CompanyAdmin"],
  "/area-managers": ["CompanyAdmin"],
  // The API currently authorizes both agency and territory registration/listing
  // for Area Managers only; match that rule in the route guard.
  "/agencies": ["AreaManager"],
  "/territories": ["AreaManager"],
  "/territory-assignments": ["AreaManager"],
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
