import { apiFetch, catalogApiFetch, orderApiFetch } from "@/api/client";
import {
  OrderApiError,
  type CatalogueProduct,
  type CheckIn,
  type CheckInInput,
  type ApprovalDecision,
  type Payment,
  type CreateOrderInput,
  type HierarchyNames,
  type Order,
  type OrderApiErrorBody,
  type OrderListQuery,
  type PagedOrders,
  type ShopOption,
} from "./types";

async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let body: OrderApiErrorBody = {};
  try {
    body = (await response.json()) as OrderApiErrorBody;
  } catch {
    // Keep the HTTP status when the server returns no JSON body.
  }

  throw new OrderApiError(response.status, body);
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return orderApiFetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<Order>);
}

export function checkInAtShop(orderId: string, input: CheckInInput): Promise<CheckIn> {
  return orderApiFetch(`/api/orders/${encodeURIComponent(orderId)}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<CheckIn>);
}

/** Cash only (FR-4.4a); the amount must equal the order total. */
export function recordCashPayment(orderId: string, amount: number): Promise<Payment> {
  return orderApiFetch(`/api/orders/${encodeURIComponent(orderId)}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, method: "Cash" }),
  }).then(unwrap<Payment>);
}

/** US-E4-5: agency approves or rejects a scheduled delivery. Reason is required to reject. */
export function decideApproval(
  orderId: string,
  decision: ApprovalDecision,
  reason?: string,
): Promise<Order> {
  return orderApiFetch(`/api/orders/${encodeURIComponent(orderId)}/approval`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reason: reason?.trim() || undefined }),
  }).then(unwrap<Order>);
}

/**
 * US-E4-5: shop owner cancels their own order. No time is sent — the server
 * measures the window from the stored confirmation time.
 */
export function cancelOrder(orderId: string, reason?: string): Promise<Order> {
  return orderApiFetch(`/api/orders/${encodeURIComponent(orderId)}/cancellation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason?.trim() || undefined }),
  }).then(unwrap<Order>);
}

export function fetchOrders(query: OrderListQuery): Promise<PagedOrders> {
  const parameters = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  return orderApiFetch(`/api/orders?${parameters.toString()}`).then(unwrap<PagedOrders>);
}

export function fetchOrder(orderId: string): Promise<Order> {
  return orderApiFetch(`/api/orders/${encodeURIComponent(orderId)}`).then(unwrap<Order>);
}

export function fetchOrderCatalogue(): Promise<CatalogueProduct[]> {
  return catalogApiFetch("/api/products/catalogue").then(unwrap<CatalogueProduct[]>);
}

interface HierarchyTree {
  provinces: Array<{
    provinceId: string;
    agencies: Array<{
      agencyId: string;
      name: string;
      territories: Array<{
        territoryId: string;
        name: string;
        shops: Array<{
          shopId: string;
          name: string;
          ownerName?: string | null;
          address: string;
        }>;
      }>;
    }>;
  }>;
}

function fetchHierarchy(): Promise<HierarchyTree> {
  return apiFetch("/api/hierarchy").then(unwrap<HierarchyTree>);
}

/**
 * Shops the caller can order for. Organization scopes GET /api/hierarchy by
 * the token's `sub`, so a Sales Rep only receives their own territory's shops.
 */
export async function fetchOrderableShops(): Promise<ShopOption[]> {
  const tree = await fetchHierarchy();

  return tree.provinces.flatMap((province) =>
    province.agencies.flatMap((agency) =>
      agency.territories.flatMap((territory) =>
        territory.shops.map((shop) => ({
          shopId: shop.shopId,
          name: shop.name,
          address: shop.address,
          ownerName: shop.ownerName ?? null,
          territoryId: territory.territoryId,
          territoryName: territory.name,
          agencyId: agency.agencyId,
          agencyName: agency.name,
          provinceId: province.provinceId,
        })),
      ),
    ),
  );
}

/** ID → name lookups so order screens can show names instead of GUIDs. */
export async function fetchHierarchyNames(): Promise<HierarchyNames> {
  const tree = await fetchHierarchy();
  const names: HierarchyNames = { shops: {}, agencies: {} };

  for (const province of tree.provinces) {
    for (const agency of province.agencies) {
      names.agencies[agency.agencyId] = agency.name;
      for (const territory of agency.territories) {
        for (const shop of territory.shops) {
          names.shops[shop.shopId] = shop.name;
        }
      }
    }
  }

  return names;
}
