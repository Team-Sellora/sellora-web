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
  // POST /api/staff: Company Admins add any staff role, Agency Operators add Sales Reps.
  "/staff": ["CompanyAdmin", "AgencyOperator"],
  "/shops": ["AgencyOperator"],
  "/products": ["CompanyAdmin", "AreaManager", "AgencyOperator", "SalesRep"],
  "/products/new": ["CompanyAdmin"],
  "/inventory": ["CompanyAdmin", "AgencyOperator", "SalesRep"],
  // Shop Owners can read their own shop's orders (server-side scoping).
  "/orders": ["CompanyAdmin", "AreaManager", "AgencyOperator", "SalesRep", "ShopOwner"],
  // POST /api/orders is RequireSalesRep on the server.
  "/orders/new": ["SalesRep"],
  // US-E4-6: reps see their own returns, operators their agency's, admins all.
  "/van-returns": ["CompanyAdmin", "AgencyOperator", "SalesRep"],
  // POST /api/van-returns is RequireSalesRep on the server.
  "/van-returns/new": ["SalesRep"],
  // US-E5-3: the Notification service's admin endpoints are RequireCompanyAdmin.
  "/notifications": ["CompanyAdmin"],
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

  if (/^\/van-returns\/[^/]+$/.test(path)) {
    const vanReturnReaderRoles = routeAccess["/van-returns"] ?? [];

    return role !== null && vanReturnReaderRoles.includes(role);
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
