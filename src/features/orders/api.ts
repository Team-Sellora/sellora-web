import { apiFetch, catalogApiFetch, orderApiFetch } from "@/api/client";
import {
  OrderApiError,
  type CatalogueProduct,
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
