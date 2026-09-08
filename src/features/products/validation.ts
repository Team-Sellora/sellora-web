import type {
  CreateProductFormErrors,
  CreateProductFormValues,
  ProductCoreFormErrors,
  ProductCoreFormValues,
  UpdateProductFormErrors,
  UpdateProductFormValues,
} from "./types";

function validateProductCore(values: ProductCoreFormValues): ProductCoreFormErrors {
  const errors: ProductCoreFormErrors = {};
  const sku = values.sku.trim();
  const name = values.name.trim();
  const description = values.description.trim();
  const unitOfMeasure = values.unitOfMeasure.trim();

  if (!sku) {
    errors.sku = "SKU is required.";
  } else if (sku.length > 80) {
    errors.sku = "SKU cannot exceed 80 characters.";
  }

  if (!name) {
    errors.name = "Product name is required.";
  } else if (name.length > 200) {
    errors.name = "Product name cannot exceed 200 characters.";
  }

  if (description.length > 1000) {
    errors.description = "Description cannot exceed 1000 characters.";
  }

  if (!unitOfMeasure) {
    errors.unitOfMeasure = "Unit of measure is required.";
  } else if (unitOfMeasure.length > 40) {
    errors.unitOfMeasure = "Unit of measure cannot exceed 40 characters.";
  }

  return errors;
}

export function validateCreateProduct(values: CreateProductFormValues): CreateProductFormErrors {
  const errors: CreateProductFormErrors = validateProductCore(values);
  const batchCode = values.batchCode.trim();
  const price = Number(values.currentUnitPrice);

  if (!values.currentUnitPrice.trim()) {
    errors.currentUnitPrice = "Unit price is required.";
  } else if (!Number.isFinite(price) || price <= 0) {
    errors.currentUnitPrice = "Unit price must be greater than zero.";
  }

  if (!batchCode) {
    errors.batchCode = "Batch code is required.";
  } else if (batchCode.length > 80) {
    errors.batchCode = "Batch code cannot exceed 80 characters.";
  }

  if (!values.manufacturingDate) {
    errors.manufacturingDate = "Manufacturing date is required.";
  }

  if (!values.expiryDate) {
    errors.expiryDate = "Expiry date is required.";
  }

  if (
    values.manufacturingDate &&
    values.expiryDate &&
    values.expiryDate <= values.manufacturingDate
  ) {
    errors.expiryDate = "Expiry date must be after the manufacturing date.";
  }

  return errors;
}
export function validateUpdateProduct(values: UpdateProductFormValues): UpdateProductFormErrors {
  return validateProductCore(values);
}

export function hasValidationErrors(errors: CreateProductFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
