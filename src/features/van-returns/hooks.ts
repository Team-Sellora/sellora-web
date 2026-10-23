import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockQueryKey } from "@/features/inventory/hooks";
import { acceptVanReturn, declareVanReturn, fetchVanReturn, fetchVanReturns } from "./api";
import type { CountLineInput, DeclareLineInput } from "./types";

export const vanReturnsQueryKey = ["van-returns"] as const;

export function useVanReturns(query: { page: number; pageSize: number; status?: string }) {
  return useQuery({
    queryKey: [...vanReturnsQueryKey, "list", query],
    queryFn: () => fetchVanReturns(query),
  });
}

export function useVanReturn(vanReturnId: string) {
  return useQuery({
    queryKey: [...vanReturnsQueryKey, "detail", vanReturnId],
    queryFn: () => fetchVanReturn(vanReturnId),
  });
}

export function useDeclareVanReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lines: DeclareLineInput[]) => declareVanReturn(lines),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vanReturnsQueryKey }),
  });
}

export function useAcceptVanReturn(vanReturnId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lines, note }: { lines: CountLineInput[]; note?: string | undefined }) =>
      acceptVanReturn(vanReturnId, lines, note),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: vanReturnsQueryKey });
      // Stock moves when Inventory consumes the event, a moment later.
      await queryClient.invalidateQueries({ queryKey: stockQueryKey });
    },
  });
}
