import type { SelloraRole } from "./useSelloraAuth";

export const routeAccess: Record<string, SelloraRole[]> = {
  "/provinces": ["CompanyAdmin"],
  "/area-managers": ["CompanyAdmin"],
  "/hierarchy-roll-up": ["CompanyAdmin"],
  // The API currently authorizes both agency and territory registration/listing
  // for Area Managers only; match that rule in the route guard.
  "/agencies": ["AreaManager"],
  "/territories": ["AreaManager"],
  "/territory-assignments": ["AreaManager"],
  "/sales-reps": ["AgencyOperator"],
  "/shops": ["AgencyOperator"],
  "/products": ["CompanyAdmin", "AreaManager", "AgencyOperator", "SalesRep"],
  "/products/new": ["CompanyAdmin"],
  "/inventory": ["CompanyAdmin", "AgencyOperator", "SalesRep"],
  "/orders": ["CompanyAdmin", "AreaManager", "AgencyOperator", "SalesRep"],
};

export function isRoleAllowed(path: string, role: SelloraRole | null): boolean {
  const exactRoles = routeAccess[path];

  if (exactRoles) {
    return role !== null && exactRoles.includes(role);
  }

  const isProductEditRoute = /^\/products\/[^/]+\/edit$/.test(path);

  if (isProductEditRoute) {
    return role === "CompanyAdmin";
  }

  const isProductDetailsRoute = /^\/products\/[^/]+$/.test(path);

  if (isProductDetailsRoute) {
    const productReaderRoles = routeAccess["/products"] ?? [];

    return role !== null && productReaderRoles.includes(role);
  }

  return true;
}
