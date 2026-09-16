import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustStock,
  confirmReservation,
  fetchInventoryOwners,
  fetchStock,
  releaseReservation,
  reserveStock,
  resolveFulfilment,
} from "./api";
import type {
  ResolveFulfilmentInput,
  StockAdjustmentInput,
  StockListQuery,
  StockReservationInput,
} from "./types";

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

export function useInventoryOwners() {
  return useQuery({
    queryKey: ["inventory", "owners"],
    queryFn: fetchInventoryOwners,
  });
}

function useStockMutation<TInput>(mutationFn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stockQueryKey }),
  });
}

export function useReserveStock() {
  return useStockMutation<StockReservationInput>(reserveStock);
}

export function useResolveFulfilment() {
  return useStockMutation<ResolveFulfilmentInput>(resolveFulfilment);
}

export function useConfirmReservation() {
  return useStockMutation<string>(confirmReservation);
}

export function useReleaseReservation() {
  return useStockMutation<string>(releaseReservation);
}
