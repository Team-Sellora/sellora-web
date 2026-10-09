import { deliveryApiFetch } from "@/api/client";
import {
  DeliveryApiError,
  type AssignDeliveryPayload,
  type EligibleRep,
  type UpdateDeliveryStatusPayload,
  type PaginatedDeliveries,
  type DeliveryDetail,
} from "./types";

async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  let detail: string | undefined;
  try {
    const body = (await response.json()) as { detail?: string; title?: string };
    detail = body.detail ?? body.title;
  } catch {
    // No JSON body
  }

  throw new DeliveryApiError(response.status, detail);
}

export function fetchEligibleReps(deliveryJobId: string): Promise<EligibleRep[]> {
  return deliveryApiFetch(
    `/api/deliveries/${encodeURIComponent(deliveryJobId)}/eligible-reps`,
  ).then(unwrap<EligibleRep[]>);
}

export function assignDelivery(
  deliveryJobId: string,
  payload: AssignDeliveryPayload,
): Promise<void> {
  return deliveryApiFetch(`/api/deliveries/${encodeURIComponent(deliveryJobId)}/assignment`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(unwrap<void>);
}

export function updateDeliveryStatus(
  deliveryJobId: string,
  payload: UpdateDeliveryStatusPayload,
): Promise<void> {
  return deliveryApiFetch(`/api/deliveries/${encodeURIComponent(deliveryJobId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(unwrap<void>);
}

export interface GetDeliveriesParams {
  status?: string[];
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  salesRepId?: string;
  shopId?: string;
  orderId?: string;
  includeHandovers?: boolean;
  page?: number;
  pageSize?: number;
}

export function getDeliveries(params: GetDeliveriesParams): Promise<PaginatedDeliveries> {
  const searchParams = new URLSearchParams();

  if (params.status) {
    params.status.forEach((s) => searchParams.append("status", s));
  }
  if (params.scheduledDateFrom) searchParams.set("scheduledDateFrom", params.scheduledDateFrom);
  if (params.scheduledDateTo) searchParams.set("scheduledDateTo", params.scheduledDateTo);
  if (params.salesRepId) searchParams.set("salesRepId", params.salesRepId);
  if (params.shopId) searchParams.set("shopId", params.shopId);
  if (params.orderId) searchParams.set("orderId", params.orderId);
  if (params.includeHandovers !== undefined) {
    searchParams.set("includeHandovers", String(params.includeHandovers));
  }
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 20));

  const qs = searchParams.toString();
  return deliveryApiFetch(`/api/deliveries${qs ? `?${qs}` : ""}`).then(unwrap<PaginatedDeliveries>);
}

export function getDelivery(deliveryJobId: string): Promise<DeliveryDetail> {
  return deliveryApiFetch(`/api/deliveries/${encodeURIComponent(deliveryJobId)}`).then(
    unwrap<DeliveryDetail>,
  );
}
