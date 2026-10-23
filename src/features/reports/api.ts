import { auditApiFetch } from "@/api/client";
import { ReportsApiError } from "./apiError";
import type {
  SalesBreakdownParams,
  SalesBreakdownResponse,
  SalesSummaryParams,
  SalesSummaryResponse,
} from "./types";

export function buildSalesSummaryParams(params: SalesSummaryParams): URLSearchParams {
  const query = new URLSearchParams();
  if (params.from) {
    query.set("from", params.from);
  }
  if (params.to) {
    query.set("to", params.to);
  }
  if (params.compareFrom) {
    query.set("compareFrom", params.compareFrom);
  }
  if (params.compareTo) {
    query.set("compareTo", params.compareTo);
  }
  return query;
}

export function buildSalesBreakdownParams(params: SalesBreakdownParams): URLSearchParams {
  const query = new URLSearchParams();
  query.set("groupBy", params.groupBy);
  if (params.from) {
    query.set("from", params.from);
  }
  if (params.to) {
    query.set("to", params.to);
  }
  if (params.sort) {
    query.set("sort", params.sort);
  }
  if (params.direction) {
    query.set("direction", params.direction);
  }
  return query;
}

async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let detail: string | undefined;
  let title: string | undefined;
  try {
    const body = (await response.json()) as { detail?: string; title?: string; message?: string };
    detail = body.detail ?? body.message;
    title = body.title;
  } catch {
    // Non-JSON response
  }

  if (response.status === 503 && !detail) {
    detail = "Organization service is unavailable, some area names may be missing";
  }

  throw new ReportsApiError(response.status, detail, title);
}

export function fetchSalesSummary(params: SalesSummaryParams): Promise<SalesSummaryResponse> {
  const query = buildSalesSummaryParams(params);
  return auditApiFetch(`/api/reports/sales-summary?${query.toString()}`).then(
    unwrap<SalesSummaryResponse>,
  );
}

export function fetchSalesBreakdown(params: SalesBreakdownParams): Promise<SalesBreakdownResponse> {
  const query = buildSalesBreakdownParams(params);
  return auditApiFetch(`/api/reports/sales-breakdown?${query.toString()}`).then(
    unwrap<SalesBreakdownResponse>,
  );
}
