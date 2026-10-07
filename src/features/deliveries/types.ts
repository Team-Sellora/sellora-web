export interface EligibleRep {
  salesRepId: string;
  displayName: string;
}

export interface AssignDeliveryPayload {
  salesRepId: string;
  scheduledDate: string; // ISO 8601 string or YYYY-MM-DD
}

export class DeliveryApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string | undefined,
  ) {
    super(detail ?? `The delivery service answered ${status}.`);
    this.name = "DeliveryApiError";
  }
}

export type DeliveryStatus =
  "Pending" | "Assigned" | "InTransit" | "Delivered" | "Failed" | "Cancelled";

export interface UpdateDeliveryStatusPayload {
  status: "InTransit" | "Delivered" | "Failed";
  reason?: string;
}

export interface DeliveryStatusHistoryEntry {
  status: DeliveryStatus;
  actorRole: string;
  occurredAt: string;
  reason?: string;
}
