import { describe, expect, it } from "vitest";
import { hasValidationErrors, MAX_ORDER_LINES, validateCreateOrder } from "./validation";
import type { OrderLineFormValues } from "./types";

const line = (key: string, productId: string, quantity: string): OrderLineFormValues => ({
  key,
  productId,
  quantity,
});

describe("validateCreateOrder", () => {
  it("accepts a shop with valid lines", () => {
    const errors = validateCreateOrder({
      shopId: "shop-1",
      lines: [line("a", "p-1", "3"), line("b", "p-2", "1")],
    });

    expect(hasValidationErrors(errors)).toBe(false);
  });

  it("requires a shop and at least one line", () => {
    const errors = validateCreateOrder({ shopId: "", lines: [] });

    expect(errors.shopId).toBeDefined();
    expect(errors.lines).toBeDefined();
  });

  it.each(["0", "-2", "1.5", ""])("rejects quantity %s", (quantity) => {
    const errors = validateCreateOrder({ shopId: "s", lines: [line("a", "p-1", quantity)] });

    expect(errors.lineErrors?.["a"]).toMatch(/whole number/);
  });

  it("flags the second occurrence of a duplicate product", () => {
    const errors = validateCreateOrder({
      shopId: "s",
      lines: [line("a", "p-1", "1"), line("b", "p-1", "2")],
    });

    expect(errors.lineErrors?.["a"]).toBeUndefined();
    expect(errors.lineErrors?.["b"]).toMatch(/already on the order/);
  });

  it("requires a product on every line", () => {
    const errors = validateCreateOrder({ shopId: "s", lines: [line("a", "", "1")] });

    expect(errors.lineErrors?.["a"]).toMatch(/Select a product/);
  });

  it("caps the number of lines", () => {
    const lines = Array.from({ length: MAX_ORDER_LINES + 1 }, (_, index) =>
      line(String(index), `p-${index}`, "1"),
    );

    expect(validateCreateOrder({ shopId: "s", lines }).lines).toMatch(/more than/);
  });
});
