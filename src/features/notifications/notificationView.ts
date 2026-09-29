import type { NotificationRecipient, NotificationRequest, NotificationStatus } from "./types";

const statusLabels: Record<string, string> = {
  Failed: "Retrying",
  PartiallySent: "Partly sent",
  PermanentlyFailed: "Gave up",
  Pending: "Queued",
  Sent: "Sent",
};

export function formatNotificationStatus(status: NotificationStatus): string {
  return statusLabels[status] ?? status;
}

/** Red for "someone has to act", amber for "still retrying on its own". */
export function statusTone(status: NotificationStatus): "danger" | "warning" | "neutral" {
  if (status === "PermanentlyFailed") return "danger";
  if (status === "Failed" || status === "PartiallySent") return "warning";
  return "neutral";
}

const eventLabels: Record<string, string> = {
  PaymentRecorded: "Payment recorded",
  OrderPlaced: "Order placed",
  OrderConfirmed: "Order confirmed",
  OrderCancelled: "Order cancelled",
  DeliveryStatusChanged: "Delivery update",
  DeliveryDisputed: "Delivery disputed",
  LowStockDetected: "Low stock",
};

const recipientLabels: Record<string, string> = {
  Shop: "Shop",
  Agency: "Agency",
  CompanyAdmin: "Company admin",
};

export function formatRecipientKind(kind: string): string {
  return recipientLabels[kind] ?? kind;
}

export function formatEventType(eventType: string): string {
  return eventLabels[eventType] ?? eventType;
}

/** The recipients still owed the message — the ones Resend will send to. */
export function unsentRecipients(request: NotificationRequest): NotificationRecipient[] {
  return request.recipients.filter((recipient) => recipient.deliveryStatus !== "Sent");
}

/** Same shape the server checks (EmailAddressRules), so the form can say it first. */
export function isWellFormedEmail(value: string): boolean {
  const address = value.trim();
  if (!address || address.length > 320 || /\s/.test(address)) return false;
  const parts = address.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts as [string, string];
  return (
    local.length > 0 &&
    domain.length > 2 &&
    domain.includes(".") &&
    !domain.startsWith(".") &&
    !domain.endsWith(".") &&
    !domain.includes("..")
  );
}
