import { apiFetch } from "@/api/client";
import {
  ProductApiError,
  type ApiErrorBody,
  type PagedProducts,
  type Product,
  type ProductListQuery,
} from "./types";

async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let body: ApiErrorBody = {};
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // Keep the fallback HTTP error when the server returns no JSON body.
  }

  throw new ProductApiError(response.status, body);
}

export function fetchProducts(query: ProductListQuery): Promise<PagedProducts> {
  const parameters = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    status: query.status ?? "Active",
  });

  if (query.search?.trim()) {
    parameters.set("search", query.search.trim());
  }

  return apiFetch(`/api/products?${parameters.toString()}`).then(unwrap<PagedProducts>);
}

export function deactivateProduct(productId: string): Promise<Product> {
  return apiFetch(`/api/products/${productId}/deactivate`, {
    method: "PATCH",
  }).then(unwrap<Product>);
}
