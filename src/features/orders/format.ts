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
