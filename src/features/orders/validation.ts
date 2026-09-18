import type { CreateOrderFormErrors, CreateOrderFormValues } from "./types";

// Matches the server rule (Catalog resolve limit).
export const MAX_ORDER_LINES = 100;

export function validateCreateOrder(values: CreateOrderFormValues): CreateOrderFormErrors {
  const errors: CreateOrderFormErrors = {};
  const lineErrors: Record<string, string> = {};

  if (!values.shopId) {
    errors.shopId = "Select the shop this order is for.";
  }

  if (values.lines.length === 0) {
    errors.lines = "Add at least one product.";
  } else if (values.lines.length > MAX_ORDER_LINES) {
    errors.lines = `An order cannot have more than ${MAX_ORDER_LINES} lines.`;
  }

  const seen = new Set<string>();

  for (const line of values.lines) {
    if (!line.productId) {
      lineErrors[line.key] = "Select a product.";
      continue;
    }

    if (seen.has(line.productId)) {
      lineErrors[line.key] = "This product is already on the order. Combine the quantities.";
      continue;
    }
    seen.add(line.productId);

    const quantity = Number(line.quantity);
    if (line.quantity.trim() === "" || !Number.isInteger(quantity) || quantity < 1) {
      lineErrors[line.key] = "Quantity must be a whole number of at least 1.";
    }
  }

  if (Object.keys(lineErrors).length > 0) {
    errors.lineErrors = lineErrors;
  }

  return errors;
}

export function hasValidationErrors(errors: CreateOrderFormErrors): boolean {
  return Boolean(errors.shopId ?? errors.lines ?? errors.form) || errors.lineErrors !== undefined;
}
