import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchSalesBreakdown, fetchSalesSummary } from "./api";
import { validateDateRange } from "./dateRange";
import type { SalesBreakdownParams, SalesSummaryParams } from "./types";

export const reportsQueryKey = ["reports"] as const;

export function useSalesSummary(params: SalesSummaryParams, options?: { enabled?: boolean }) {
  const isDateValid = validateDateRange(params.from, params.to) === null;

  return useQuery({
    queryKey: [...reportsQueryKey, "summary", params],
    queryFn: () => fetchSalesSummary(params),
    enabled: isDateValid && (options?.enabled ?? true),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useSalesBreakdown(params: SalesBreakdownParams, options?: { enabled?: boolean }) {
  const isDateValid = validateDateRange(params.from, params.to) === null;

  return useQuery({
    queryKey: [...reportsQueryKey, "breakdown", params.groupBy, params],
    queryFn: () => fetchSalesBreakdown(params),
    enabled: isDateValid && (options?.enabled ?? true),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
