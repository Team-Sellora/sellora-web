import { catalogApiFetch as apiFetch } from "@/api/client";
import {
  ProductApiError,
  type ApiErrorBody,
  type CreateProductInput,
  type PagedProducts,
  type PriceHistoryEntry,
  type ProductCategory,
  type Product,
  type ProductListQuery,
  type UpdateProductInput,
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

  if (query.categoryId) {
    parameters.set("categoryId", query.categoryId);
  }

  return apiFetch(`/api/products?${parameters.toString()}`).then(unwrap<PagedProducts>);
}

export function fetchActiveCategories(): Promise<ProductCategory[]> {
  return apiFetch("/api/categories?status=Active").then(unwrap<ProductCategory[]>);
}

export function deactivateProduct(productId: string): Promise<Product> {
  return apiFetch(`/api/products/${productId}/deactivate`, {
    method: "PATCH",
  }).then(unwrap<Product>);
}

export function createProduct(input: CreateProductInput): Promise<Product> {
  return apiFetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  }).then(unwrap<Product>);
}

export function updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
  return apiFetch(`/api/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  }).then(unwrap<Product>);
}

export function fetchProduct(productId: string): Promise<Product> {
  return apiFetch(`/api/products/${productId}`).then(unwrap<Product>);
}

export function fetchProductPriceHistory(productId: string): Promise<PriceHistoryEntry[]> {
  return apiFetch(`/api/products/${productId}/price-history`).then(unwrap<PriceHistoryEntry[]>);
}
