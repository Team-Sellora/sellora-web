export type ReturnStatus = "Requested" | "Approved" | "Rejected";

export interface ReturnLine {
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
}

export interface ReturnRequestSummary {
  id: string;
  returnRequestId: string;
  returnReference: string;
  deliveryJobId: string;
  orderReference: string;
  shopName: string;
  status: ReturnStatus;
  requestedAt: string;
  requestedByRole: string;
  lineCount: number;
}

export interface PaginatedReturns {
  items: ReturnRequestSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ReturnRequestDetail {
  returnRequestId: string;
  returnReference: string;
  deliveryJobId: string;
  orderReference: string;
  shopName: string;
  status: ReturnStatus;
  requestedByUserId: string;
  requestedByRole: string;
  requestedAt: string;
  decidedByUserId: string | null;
  decidedByRole: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  lines: ReturnLine[];
}

export interface CreateReturnLinePayload {
  productId: string;
  quantity: number;
  reason: string;
}

export interface CreateReturnPayload {
  deliveryJobId: string;
  lines: CreateReturnLinePayload[];
}

export interface CreateReturnResponse {
  returnRequestId: string;
  returnReference: string;
  status: ReturnStatus;
}

export interface DecideReturnPayload {
  decision: "Approved" | "Rejected";
  reason?: string;
}

export interface LineError {
  productId: string;
  message: string;
}

export class ReturnApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string | undefined,
    readonly lineErrors?: LineError[],
  ) {
    super(detail ?? `The return service answered ${status}.`);
    this.name = "ReturnApiError";
  }
}
