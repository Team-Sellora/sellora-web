const lkr = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 2,
});

export function formatLkr(value: number): string {
  return lkr.format(value);
}

export function formatOrderDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}

/** Short, readable fallback when a name is not visible to the caller. */
export function shortId(id: string): string {
  return `${id.slice(0, 8)}…`;
}

const fulfilmentLabels: Record<string, string> = {
  ImmediateCashSale: "Cash sale",
  ScheduledDelivery: "Scheduled delivery",
};

const statusLabels: Record<string, string> = {
  AwaitingCheckout: "Awaiting checkout",
  Confirmed: "Confirmed",
  Cancelled: "Cancelled",
  PendingApproval: "Pending approval",
};

export function formatFulfilmentType(value: string): string {
  return fulfilmentLabels[value] ?? value;
}

export function formatOrderStatus(value: string): string {
  return statusLabels[value] ?? value;
}
