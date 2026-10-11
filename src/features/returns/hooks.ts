import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReturn, getReturn, getReturns, decideReturn, type GetReturnsParams } from "./api";
import type { CreateReturnPayload, DecideReturnPayload } from "./types";
import { deliveriesQueryKey } from "@/features/deliveries/hooks";

export const returnsQueryKey = ["returns"] as const;

export function useReturns(params: GetReturnsParams = {}) {
  return useQuery({
    queryKey: [...returnsQueryKey, params],
    queryFn: () => getReturns(params),
  });
}

export function useReturn(returnId: string) {
  return useQuery({
    queryKey: [...returnsQueryKey, returnId],
    queryFn: () => getReturn(returnId),
    enabled: !!returnId,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReturnPayload) => createReturn(payload),
    onSuccess: () => {
      // Invalidate delivery detail to refresh returnable quantities, and refresh returns list
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKey });
      queryClient.invalidateQueries({ queryKey: returnsQueryKey });
    },
  });
}

export function useDecideReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ returnId, payload }: { returnId: string; payload: DecideReturnPayload }) =>
      decideReturn(returnId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: returnsQueryKey });
    },
  });
}
