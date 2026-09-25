import type { StockItem } from "@/features/inventory/types";

/** What the rep's van can hand back per product: on hand minus held, summed over batches. */
export function returnableByProduct(stock: StockItem[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const item of stock) {
    if (item.ownerType !== "SalesRep") {
      continue;
    }
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.availableQuantity);
  }

  return totals;
}

/** A field error for one declared quantity, mirroring the server's 422. */
export function declaredQuantityError(quantity: number, held: number): string | null {
  if (!Number.isInteger(quantity) || quantity < 0) {
    return "Enter a whole number.";
  }
  return quantity > held ? `Your van holds only ${held}.` : null;
}

export function countedQuantityError(counted: number | null, declared: number): string | null {
  if (counted === null || !Number.isInteger(counted) || counted < 0) {
    return "Enter what you counted (0 or more).";
  }
  return counted > declared ? `The rep declared only ${declared}.` : null;
}

export type VarianceTone = "none" | "short" | "invalid";

/** Declared minus counted; the headline number on the acceptance screen. */
export function variance(declared: number, counted: number | null): number | null {
  return counted === null ? null : declared - counted;
}

export function varianceTone(value: number | null): VarianceTone {
  if (value === null) {
    return "none";
  }
  if (value < 0) {
    return "invalid";
  }
  return value > 0 ? "short" : "none";
}

export function describeVariance(value: number | null): string {
  if (value === null) {
    return "Not counted yet";
  }
  if (value === 0) {
    return "Matches the declaration";
  }
  return value > 0 ? `${value} short` : `${-value} over`;
}
