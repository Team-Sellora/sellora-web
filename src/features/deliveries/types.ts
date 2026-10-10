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

export type ConfirmationState = "Awaiting" | "Confirmed" | "Disputed";

export interface DeliveryConfirmation {
  state?: ConfirmationState;
  status?: ConfirmationState;
  note?: string;
  notes?: string;
  time?: string;
  confirmedAt?: string;
}

export interface SubmitDeliveryConfirmationPayload {
  outcome: "Confirmed" | "Disputed";
  note?: string;
}

export interface DeliverySummary {
  id: string;
  deliveryReference: string;
  orderId: string;
  orderReference: string;
  shopName: string;
  territory: string;
  status: DeliveryStatus;
  scheduledDate: string | null;
  assignedRepName: string | null;
  confirmationState?: ConfirmationState | null;
}

export interface DeliveryLine {
  id: string;
  productName: string;
  quantity: number;
  returnableQuantity: number;
}

export interface DeliveryDetail extends DeliverySummary {
  lines: DeliveryLine[];
  history: DeliveryStatusHistoryEntry[];
  confirmation: DeliveryConfirmation | null;
}

export interface PaginatedDeliveries {
  items: DeliverySummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}
