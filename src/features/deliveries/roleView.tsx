import type { SelloraRole } from "@/auth/useSelloraAuth";

export type DeliveryColumn =
  "deliveryRef" | "orderRef" | "shop" | "territory" | "status" | "date" | "rep" | "assign";

export function deliveryColumnsFor(role: SelloraRole | null): DeliveryColumn[] {
  if (role === "CompanyAdmin" || role === "AreaManager" || role === "AgencyOperator") {
    return ["deliveryRef", "orderRef", "shop", "territory", "status", "date", "rep", "assign"];
  }
  if (role === "SalesRep") {
    return ["shop", "status", "date"];
  }
  if (role === "ShopOwner") {
    return ["orderRef", "status", "date"];
  }
  return [];
}

export function deliveryListTitle(role: SelloraRole | null): string {
  if (role === "SalesRep") return "My deliveries";
  return "Deliveries";
}

export function deliveryListDescription(role: SelloraRole | null): string {
  if (role === "ShopOwner") return "Track the status of your upcoming deliveries.";
  if (role === "SalesRep") return "Manage deliveries assigned to your route.";
  return "Monitor and assign field deliveries across the network.";
}

export function emptyDeliveriesMessage(role: SelloraRole | null): string {
  if (role === "ShopOwner") return "You have no upcoming deliveries.";
  if (role === "SalesRep") return "No deliveries assigned to you.";
  return "No deliveries found.";
}
