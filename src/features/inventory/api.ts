import { inventoryApiFetch } from "@/api/client";
import {
  StockApiError,
  type StockAdjustmentInput,
  type StockAdjustmentResponse,
  type StockApiErrorBody,
  type StockItem,
  type StockListQuery,
} from "./types";

async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let body: StockApiErrorBody = {};
  try {
    body = (await response.json()) as StockApiErrorBody;
  } catch {
    // Preserve the HTTP status when the API does not return a JSON error body.
  }

  throw new StockApiError(response.status, body);
}

export function fetchStock(query: StockListQuery = {}): Promise<StockItem[]> {
  const parameters = new URLSearchParams();

  if (query.productId?.trim()) {
    parameters.set("productId", query.productId.trim());
  }

  if (query.inventoryOwnerId?.trim()) {
    parameters.set("inventoryOwnerId", query.inventoryOwnerId.trim());
  }

  const suffix = parameters.size > 0 ? `?${parameters.toString()}` : "";
  return inventoryApiFetch(`/api/stock${suffix}`).then(unwrap<StockItem[]>);
}

export function adjustStock(input: StockAdjustmentInput): Promise<StockAdjustmentResponse> {
  return inventoryApiFetch("/api/stock/adjustments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<StockAdjustmentResponse>);
}
