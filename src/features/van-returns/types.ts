export type VanReturnStatus = "Declared" | "Accepted" | (string & {});

export interface VanReturnLine {
  vanReturnLineId: string;
  productId: string;
  productName: string | null;
  declaredQuantity: number;
  countedQuantity: number | null;
  /** Declared minus counted, once counted. Positive = fewer units arrived than declared. */
  variance: number | null;
}

export interface VanReturn {
  vanReturnId: string;
  returnReference: string;
  status: VanReturnStatus;
  salesRepId: string;
  salesRepName: string | null;
  agencyId: string;
  vanInventoryOwnerId: string;
  declaredAt: string;
  declaredBy: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  acceptanceNote: string | null;
  totalDeclared: number;
  totalCounted: number | null;
  totalVariance: number | null;
  lines: VanReturnLine[];
}

export interface VanReturnSummary {
  vanReturnId: string;
  returnReference: string;
  status: VanReturnStatus;
  salesRepId: string;
  salesRepName: string | null;
  agencyId: string;
  declaredAt: string;
  acceptedAt: string | null;
  lineCount: number;
  totalDeclared: number;
  totalCounted: number | null;
  totalVariance: number | null;
}

export interface PagedVanReturns {
  items: VanReturnSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface VanStockShortage {
  productId: string;
  productName: string | null;
  requestedQuantity: number;
  heldQuantity: number;
}

export interface VanReturnApiErrorBody {
  title?: string;
  detail?: string;
  shortages?: VanStockShortage[];
  dependency?: string;
}

export class VanReturnApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: VanReturnApiErrorBody,
  ) {
    super(body.detail ?? body.title ?? `The request failed (HTTP ${status}).`);
    this.name = "VanReturnApiError";
  }
}

export interface DeclareLineInput {
  productId: string;
  quantity: number;
}

export interface CountLineInput {
  productId: string;
  countedQuantity: number;
}
