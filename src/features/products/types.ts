export interface ProductBatch {
  batchId: string;
  batchCode: string;
  manufacturingDate: string;
  expiryDate: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface Product {
  productId: string;
  sku: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  currentUnitPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  batches: ProductBatch[];
}

export interface PriceHistoryEntry {
  priceHistoryId: string;
  productId: string;
  oldUnitPrice: number;
  newUnitPrice: number;
  changedBy: string;
  reason: string;
  changedAt: string;
  effectiveFrom: string;
}

export interface PagedProducts {
  items: Product[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ProductListQuery {
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  currentUnitPrice: number;
  batchCode: string;
  manufacturingDate: string;
  expiryDate: string;
}

export interface ProductCoreFormValues {
  sku: string;
  name: string;
  description: string;
  unitOfMeasure: string;
}

export interface ProductCoreFormErrors {
  sku?: string;
  name?: string;
  description?: string;
  unitOfMeasure?: string;
}

export interface CreateProductFormValues extends ProductCoreFormValues {
  currentUnitPrice: string;
  batchCode: string;
  manufacturingDate: string;
  expiryDate: string;
}

export interface CreateProductFormErrors extends ProductCoreFormErrors {
  currentUnitPrice?: string;
  batchCode?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  form?: string;
}

export interface UpdateProductInput {
  sku: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
}

export type UpdateProductFormValues = ProductCoreFormValues;

export interface UpdateProductFormErrors extends ProductCoreFormErrors {
  form?: string;
}

export interface ApiErrorBody {
  message?: string;
  title?: string;
  detail?: string;
}

export class ProductApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody,
  ) {
    super(body.message ?? body.detail ?? body.title ?? `Request failed with status ${status}`);

    this.name = "ProductApiError";
  }
}
