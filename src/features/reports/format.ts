const lkrWhole = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const lkrTwoDp = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-LK", {
  maximumFractionDigits: 0,
});

export function formatLkr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return lkrWhole.format(value).replace(/\u00a0/g, " ");
}

export function formatAov(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return lkrTwoDp.format(value).replace(/\u00a0/g, " ");
}

export function formatInteger(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return integerFormatter.format(value).replace(/\u00a0/g, " ");
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return `${value.toFixed(decimals)}%`;
}

export function formatSignedPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(decimals)}%`;
}

const statusLabels: Record<string, string> = {
  Confirmed: "Confirmed",
  Cancelled: "Cancelled",
  PendingApproval: "Pending approval",
  AwaitingCheckout: "Awaiting checkout",
  InTransit: "In transit",
  Delivered: "Delivered",
  Completed: "Completed",
};

export function formatFriendlyStatus(status: string): string {
  return statusLabels[status] ?? status;
}
