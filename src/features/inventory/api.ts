import { inventoryApiFetch } from "@/api/client";
import {
  StockApiError,
  type StockAdjustmentInput,
  type StockAdjustmentResponse,
  type StockApiErrorBody,
  type StockItem,
  type StockListQuery,
  type StockReservationInput,
  type StockReservationResponse,
  type ResolveFulfilmentInput,
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

/** Holds stock while an order is being created. */
export function reserveStock(input: StockReservationInput): Promise<StockReservationResponse> {
  return inventoryApiFetch("/api/stock/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<StockReservationResponse>);
}

/**
 * Chooses the fulfilment owner and creates its reservation for an agency order.
 */
export function resolveFulfilment(
  input: ResolveFulfilmentInput,
): Promise<StockReservationResponse> {
  return inventoryApiFetch("/api/stock/fulfilment/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<StockReservationResponse>);
}

/** Confirms a reservation, permanently decrementing on-hand stock. */
export function confirmReservation(reservationId: string): Promise<StockReservationResponse> {
  return inventoryApiFetch(`/api/stock/reservations/${reservationId}/confirm`, {
    method: "POST",
  }).then(unwrap<StockReservationResponse>);
}

/** Releases a reservation when an order cannot proceed. */
export function releaseReservation(reservationId: string): Promise<StockReservationResponse> {
  return inventoryApiFetch(`/api/stock/reservations/${reservationId}/release`, {
    method: "POST",
  }).then(unwrap<StockReservationResponse>);
}
