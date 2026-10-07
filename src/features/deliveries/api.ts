import { deliveryApiFetch } from "@/api/client";
import {
  DeliveryApiError,
  type AssignDeliveryPayload,
  type EligibleRep,
  type UpdateDeliveryStatusPayload,
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
