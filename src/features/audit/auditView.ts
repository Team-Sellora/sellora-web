import type { SelloraRole } from "@/auth/useSelloraAuth";
import type { AuditSearchFilter, VerificationFailureReason } from "./types";

export function canAccessAudit(role: SelloraRole | null): boolean {
  return role === "CompanyAdmin" || role === "AreaManager";
}

export function canVerifyAudit(role: SelloraRole | null): boolean {
  return role === "CompanyAdmin";
}

export function formatAuditTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return dateStr;
    }
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return dateStr;
  }
}

const KNOWN_EVENT_LABELS: Record<string, string> = {
  "order.placed": "Order Placed",
  OrderPlacedWireEvent: "Order Placed",
  OrderPlaced: "Order Placed",
  "order.confirmed": "Order Confirmed",
  OrderConfirmedWireEvent: "Order Confirmed",
  OrderConfirmed: "Order Confirmed",
  "order.approved": "Order Approved",
  OrderApproved: "Order Approved",
  "order.rejected": "Order Rejected",
  OrderRejected: "Order Rejected",
  "order.cancelled": "Order Cancelled",
  OrderCancelled: "Order Cancelled",
  "payment.recorded": "Payment Recorded",
  PaymentRecorded: "Payment Recorded",
  "delivery.job_created": "Delivery Job Created",
  DeliveryJobCreatedEvent: "Delivery Job Created",
  DeliveryJobCreated: "Delivery Job Created",
  "delivery.assigned": "Delivery Assigned",
  DeliveryAssignedEvent: "Delivery Assigned",
  DeliveryAssigned: "Delivery Assigned",
  "delivery.status_changed": "Delivery Status Changed",
  DeliveryStatusChangedEvent: "Delivery Status Changed",
  DeliveryStatusChanged: "Delivery Status Changed",
  "delivery.confirmed": "Delivery Confirmed",
  DeliveryConfirmedEvent: "Delivery Confirmed",
  DeliveryConfirmed: "Delivery Confirmed",
  "return.requested": "Return Requested",
  ReturnRequestedEvent: "Return Requested",
  ReturnRequested: "Return Requested",
  "return.accepted": "Return Accepted",
  ReturnAcceptedEvent: "Return Accepted",
  ReturnAccepted: "Return Accepted",
  "return.rejected": "Return Rejected",
  ReturnRejectedEvent: "Return Rejected",
  ReturnRejected: "Return Rejected",
  "stock.decremented": "Stock Decremented",
  StockDecremented: "Stock Decremented",
  "stock.restored": "Stock Restored",
  StockRestored: "Stock Restored",
};

export function formatEventType(eventType: string): string {
  const trimmed = eventType.trim();
  if (KNOWN_EVENT_LABELS[trimmed]) {
    return KNOWN_EVENT_LABELS[trimmed];
  }

  // Fallback: split by dots, underscores or camelCase transitions
  return trimmed
    .replaceAll(/[._-]+/g, " ")
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function shortenHash(hash: string, head = 8, tail = 8): string {
  if (!hash) return "";
  if (hash.length <= head + tail + 3) {
    return hash;
  }
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function formatPayload(payload: string): string {
  if (!payload) return "";
  try {
    const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return payload;
  }
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function extractCheckInCoordinates(payload: string): Coordinates | null {
  if (!payload) return null;
  try {
    const obj = typeof payload === "string" ? JSON.parse(payload) : payload;
    if (!obj || typeof obj !== "object") return null;

    const lat =
      obj.checkoutLatitude ??
      obj.latitude ??
      obj.checkIn?.latitude ??
      obj.checkInLatitude ??
      obj.coordinates?.latitude ??
      obj.lat;

    const lng =
      obj.checkoutLongitude ??
      obj.longitude ??
      obj.checkIn?.longitude ??
      obj.checkInLongitude ??
      obj.coordinates?.longitude ??
      obj.lng;

    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  } catch {
    return null;
  }
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function formatVerificationReason(reason: VerificationFailureReason | string): string {
  switch (reason) {
    case "HashMismatch":
      return "Hash mismatch — the entry's recorded hash does not match its contents.";
    case "PreviousHashMismatch":
      return "Previous hash mismatch — the cryptographic link to the preceding entry is broken.";
    case "MissingPosition":
      return "Missing position — an entry in the sequence is missing from the chain.";
    default:
      return reason || "Chain verification failed.";
  }
}

export function parseAuditSearchParams(
  search: Record<string, unknown>,
): AuditSearchFilter & { entry?: string | undefined } {
  const getStr = (val: unknown) => (typeof val === "string" && val.trim() ? val.trim() : undefined);
  const getNum = (val: unknown) => {
    const num = Number(val);
    return Number.isInteger(num) && num > 0 ? num : undefined;
  };

  const orderReference = getStr(search["orderReference"]);
  const aggregateType = getStr(search["aggregateType"]);
  const aggregateId = getStr(search["aggregateId"]);
  const actorUserId = getStr(search["actorUserId"]);
  const eventType = getStr(search["eventType"]);
  const from = getStr(search["from"]);
  const to = getStr(search["to"]);
  const page = getNum(search["page"]) ?? 1;
  const entry = getStr(search["entry"]);

  return {
    orderReference,
    aggregateType,
    aggregateId,
    actorUserId,
    eventType,
    from,
    to,
    page,
    pageSize: 20,
    entry,
  };
}
