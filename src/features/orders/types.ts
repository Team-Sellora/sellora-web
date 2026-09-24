// Shapes mirror sellora-order's OrderResponse / OrderSummaryResponse (US-E4-1a).

export type OrderStatus =
  "AwaitingCheckout" | "Confirmed" | "Cancelled" | "PendingApproval" | (string & {});

/** How the shop takes the goods — fixed when the order is placed (US-E4-2). */
export type FulfilmentType = "ImmediateCashSale" | "ScheduledDelivery";

export interface OrderLine {
  orderLineId: string;
  productId: string;
  productNameSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
  lineTotal: number;
}

export interface Order {
  orderId: string;
  orderReference: string;
  shopId: string;
  salesRepId: string;
  agencyId: string;
  territoryId: string;
  provinceId: string;
  fulfilmentType: FulfilmentType;
  status: OrderStatus;
  orderDate: string;
  subtotal: number;
  total: number;
  lines: OrderLine[];
  /** Null until a check-in, payment or cancellation exists (US-E4-3). */
  checkout?: OrderCheckout | null;
}

export interface OrderSummary {
  orderId: string;
  orderReference: string;
  shopId: string;
  salesRepId: string;
  agencyId: string;
  fulfilmentType: FulfilmentType;
  status: OrderStatus;
  orderDate: string;
  total: number;
  lineCount: number;
}

export interface PagedOrders {
  items: OrderSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface OrderListQuery {
  page: number;
  pageSize: number;
}

/**
 * POST /api/orders body. No total fields on purpose — the server computes them.
 * productName, unitPrice, agencyId, territoryId and provinceId are PROVISIONAL
 * until US-E4-1b resolves them server-side.
 */
export interface CreateOrderInput {
  shopId: string;
  fulfilmentType: FulfilmentType;
  agencyId: string;
  territoryId: string;
  provinceId: string;
  lines: Array<{
    productId: string;
    quantity: number;
    productName: string;
    unitPrice: number;
  }>;
}

/** A shop the rep can order for, with the placement IDs the order needs. */
export interface ShopOption {
  shopId: string;
  name: string;
  address: string;
  ownerName: string | null;
  territoryId: string;
  territoryName: string;
  agencyId: string;
  agencyName: string;
  provinceId: string;
}

/** Catalog's GET /api/products/catalogue item. */
export interface CatalogueProduct {
  productId: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
  currentUnitPrice: number;
  earliestExpiryDate: string;
}

/** Shop and agency names visible to the caller, keyed by ID. */
export interface HierarchyNames {
  shops: Record<string, string>;
  agencies: Record<string, string>;
}

export interface OrderLineFormValues {
  key: string;
  productId: string;
  quantity: string;
}

export interface CreateOrderFormValues {
  shopId: string;
  fulfilmentType: FulfilmentType;
  lines: OrderLineFormValues[];
}

export interface CreateOrderFormErrors {
  shopId?: string;
  fulfilmentType?: string;
  lines?: string;
  lineErrors?: Record<string, string>;
  form?: string;
}

export interface OrderApiErrorBody {
  message?: string;
  title?: string;
  detail?: string;
  /** US-E4-3: present on a 403 outside-radius check-in. */
  distanceMeters?: number;
  radiusMeters?: number;
  /** US-E4-3: present on a 422 amount mismatch. */
  expectedAmount?: number;
  submittedAmount?: number;
}

/** POST /api/orders/{id}/checkin response. */
export interface CheckIn {
  checkInId: string;
  orderId: string;
  accepted: boolean;
  distanceMeters: number;
  radiusMeters: number;
  latitude: number;
  longitude: number;
  recordedAt: string;
  validUntil: string | null;
}

export interface CheckInInput {
  latitude: number;
  longitude: number;
  /** ISO 8601 time of the GPS fix, from the device. */
  capturedAt: string;
  accuracyMeters?: number;
}

/** POST /api/orders/{id}/payment response. */
export interface Payment {
  paymentId: string;
  orderId: string;
  amount: number;
  method: string;
  salesRepId: string;
  checkInId: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  recordedAt: string;
}

export interface OrderCheckout {
  checkoutLatitude: number | null;
  checkoutLongitude: number | null;
  checkedOutAt: string | null;
  payment: Payment | null;
  latestCheckIn: CheckIn | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export class OrderApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: OrderApiErrorBody,
  ) {
    super(body.detail ?? body.message ?? body.title ?? `Request failed with status ${status}`);
    this.name = "OrderApiError";
  }
}
