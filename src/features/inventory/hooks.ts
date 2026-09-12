import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adjustStock, fetchStock } from "./api";
import type { StockAdjustmentInput, StockListQuery } from "./types";

export const stockQueryKey = ["inventory", "stock"] as const;

export function useStock(query: StockListQuery) {
  return useQuery({
    queryKey: [...stockQueryKey, query],
    queryFn: () => fetchStock(query),
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StockAdjustmentInput) => adjustStock(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stockQueryKey }),
  });
}
