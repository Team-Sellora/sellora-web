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
  // Shop Owners can read their own shop's orders (server-side scoping).
  "/orders": ["CompanyAdmin", "AreaManager", "AgencyOperator", "SalesRep", "ShopOwner"],
  // POST /api/orders is RequireSalesRep on the server.
  "/orders/new": ["SalesRep"],
};

export function isRoleAllowed(path: string, role: SelloraRole | null): boolean {
  const exactRoles = routeAccess[path];

  if (exactRoles) {
    return role !== null && exactRoles.includes(role);
  }

  // US-E4-3: only the rep takes payment at the counter.
  if (/^\/orders\/[^/]+\/checkout$/.test(path)) {
    return role === "SalesRep";
  }

  const isOrderDetailsRoute = /^\/orders\/[^/]+$/.test(path);

  if (isOrderDetailsRoute) {
    const orderReaderRoles = routeAccess["/orders"] ?? [];

    return role !== null && orderReaderRoles.includes(role);
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
