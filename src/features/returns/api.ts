import { deliveryApiFetch } from "@/api/client";
import {
  ReturnApiError,
  type CreateReturnPayload,
  type CreateReturnResponse,
  type DecideReturnPayload,
  type LineError,
  type PaginatedReturns,
  type ReturnRequestDetail,
  type ReturnRequestSummary,
} from "./types";

async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  let detail: string | undefined;
  let lineErrors: LineError[] | undefined;
  try {
    const body = (await response.json()) as {
      detail?: string;
      title?: string;
      lineErrors?: LineError[];
    };
    detail = body.detail ?? body.title;
    lineErrors = body.lineErrors;
  } catch {
    // No JSON body
  }

  throw new ReturnApiError(response.status, detail, lineErrors);
}

export function createReturn(payload: CreateReturnPayload): Promise<CreateReturnResponse> {
  return deliveryApiFetch("/api/returns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(unwrap<CreateReturnResponse>);
}

export interface GetReturnsParams {
  status?: string[];
  page?: number;
  pageSize?: number;
}

export function getReturns(params: GetReturnsParams = {}): Promise<PaginatedReturns> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));
  if (params.status && params.status.length > 0) {
    for (const s of params.status) {
      query.append("status", s);
    }
  }

  const queryStr = query.toString();
  const path = queryStr ? `/api/returns?${queryStr}` : "/api/returns";

  return deliveryApiFetch(path)
    .then(
      unwrap<{
        items: Array<Omit<ReturnRequestSummary, "id"> & { id?: string }>;
        page: number;
        pageSize: number;
        totalCount: number;
      }>,
    )
    .then((data) => ({
      ...data,
      items: data.items.map((item) => ({
        ...item,
        id: item.id ?? item.returnRequestId,
      })),
    }));
}

export function getReturn(returnId: string): Promise<ReturnRequestDetail> {
  return deliveryApiFetch(`/api/returns/${encodeURIComponent(returnId)}`).then(
    unwrap<ReturnRequestDetail>,
  );
}

export function decideReturn(
  returnId: string,
  payload: DecideReturnPayload,
): Promise<ReturnRequestDetail> {
  return deliveryApiFetch(`/api/returns/${encodeURIComponent(returnId)}/decision`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(unwrap<ReturnRequestDetail>);
}
