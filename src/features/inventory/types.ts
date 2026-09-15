export interface StockItem {
  stockItemId: string;
  inventoryOwnerId: string;
  ownerType: "Company" | "Agency" | "SalesRep";
  externalOwnerId: string;
  ownerDisplayName: string;
  productId: string;
  batchId: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  reorderThreshold: number | null;
  updatedAt: string;
}

export interface StockListQuery {
  productId?: string;
  inventoryOwnerId?: string;
}

export interface StockAdjustmentInput {
  inventoryOwnerId: string;
  productId: string;
  batchId: string | null;
  quantityDelta: number;
  reason: string;
}

export interface StockAdjustmentResponse extends StockItem {
  stockMovementId: string;
  quantityDelta: number;
  reason: string;
  occurredAt: string;
}

export interface ReservationLineInput {
  productId: string;
  batchId: string | null;
  quantity: number;
}

export interface StockReservationInput {
  orderReference: string;
  inventoryOwnerId: string;
  lines: ReservationLineInput[];
}

export interface ResolveFulfilmentInput {
  orderReference: string;
  agencyId: string;
  lines: ReservationLineInput[];
}

export interface StockReservationLine {
  productId: string;
  batchId: string | null;
  quantity: number;
}

export interface StockReservationResponse {
  reservationId: string;
  orderReference: string;
  inventoryOwnerId: string;
  status: string;
  expiresAt: string;
  lines: StockReservationLine[];
}

export interface StockApiErrorBody {
  message?: string;
  title?: string;
  detail?: string;
}

export class StockApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: StockApiErrorBody,
  ) {
    super(body.message ?? body.detail ?? body.title ?? `Request failed with status ${status}`);
    this.name = "StockApiError";
  }
}
