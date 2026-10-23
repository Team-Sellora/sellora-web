import { describe, expect, it } from "vitest";
import type { StockItem } from "@/features/inventory/types";
import {
  countedQuantityError,
  declaredQuantityError,
  describeVariance,
  returnableByProduct,
  variance,
  varianceTone,
} from "./vanReturnView";

const item = (productId: string, available: number, ownerType = "SalesRep") =>
  ({ productId, availableQuantity: available, ownerType }) as StockItem;

describe("van return view", () => {
  it("sums what the van can hand back across batches, ignoring other owners", () => {
    const totals = returnableByProduct([
      item("soap", 20),
      item("soap", 10),
      item("tea", 4),
      item("soap", 99, "Agency"),
    ]);

    expect(totals.get("soap")).toBe(30);
    expect(totals.get("tea")).toBe(4);
  });

  it("refuses a declaration above what the van holds (scenario 2)", () => {
    expect(declaredQuantityError(40, 30)).toBe("Your van holds only 30.");
    expect(declaredQuantityError(12, 30)).toBeNull();
    expect(declaredQuantityError(-1, 30)).toMatch(/whole number/);
  });

  it("requires a count between 0 and declared", () => {
    expect(countedQuantityError(null, 12)).toMatch(/Enter/);
    expect(countedQuantityError(13, 12)).toBe("The rep declared only 12.");
    expect(countedQuantityError(10, 12)).toBeNull();
    expect(countedQuantityError(0, 12)).toBeNull();
  });

  it("shows the variance of 12 declared, 10 counted as 2 short (scenario 3)", () => {
    const value = variance(12, 10);

    expect(value).toBe(2);
    expect(varianceTone(value)).toBe("short");
    expect(describeVariance(value)).toBe("2 short");
    expect(describeVariance(0)).toBe("Matches the declaration");
    expect(describeVariance(null)).toBe("Not counted yet");
  });
});
