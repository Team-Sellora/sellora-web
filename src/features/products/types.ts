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
