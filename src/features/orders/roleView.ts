import type { SelloraRole } from "@/auth/useSelloraAuth";

export type OrderColumn =
  "reference" | "shop" | "salesRep" | "agency" | "date" | "lines" | "total" | "status";

/**
 * Which columns each role sees. The server already filters rows by role;
 * this only hides columns that would be redundant for that role
 * (a Shop Owner does not need Shop or Agency, a rep does not need Sales rep).
 */
export function orderColumnsFor(role: SelloraRole | null): OrderColumn[] {
  switch (role) {
    case "CompanyAdmin":
    case "AreaManager":
      return ["reference", "shop", "salesRep", "agency", "date", "lines", "total", "status"];
    case "AgencyOperator":
      return ["reference", "shop", "salesRep", "date", "lines", "total", "status"];
    case "SalesRep":
      return ["reference", "shop", "date", "lines", "total", "status"];
    case "ShopOwner":
      return ["reference", "date", "lines", "total", "status"];
    default:
      return ["reference", "date", "total", "status"];
  }
}

export function orderListDescription(role: SelloraRole | null): string {
  switch (role) {
    case "CompanyAdmin":
      return "Every order placed across your company.";
    case "AreaManager":
      return "Orders placed in the provinces you manage.";
    case "AgencyOperator":
      return "Orders placed in your agency's territories.";
    case "SalesRep":
      return "Orders you have placed for your shops.";
    case "ShopOwner":
      return "Orders placed for your shop.";
    default:
      return "Field sales orders.";
  }
}

export function emptyOrdersMessage(role: SelloraRole | null): string {
  switch (role) {
    case "CompanyAdmin":
      return "No orders have been placed in your company yet.";
    case "AreaManager":
      return "No orders have been placed in your provinces yet.";
    case "AgencyOperator":
      return "No orders have been placed in your agency's territories yet.";
    case "SalesRep":
      return "You haven't placed any orders yet.";
    case "ShopOwner":
      return "No orders have been placed for your shop yet.";
    default:
      return "No orders to show.";
  }
}

/** Only reps can place orders (POST /api/orders is RequireSalesRep). */
export function canCreateOrder(role: SelloraRole | null): boolean {
  return role === "SalesRep";
}
