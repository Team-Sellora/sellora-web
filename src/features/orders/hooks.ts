import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  checkInAtShop,
  createOrder,
  decideApproval,
  recordCashPayment,
  fetchHierarchyNames,
  fetchOrder,
  fetchOrderableShops,
  fetchOrderCatalogue,
  fetchOrders,
} from "./api";
import type { ApprovalDecision, CheckInInput, CreateOrderInput, OrderListQuery } from "./types";

export const ordersQueryKey = ["orders"] as const;

export function useOrders(query: OrderListQuery) {
  return useQuery({
    queryKey: [...ordersQueryKey, "list", query],
    queryFn: () => fetchOrders(query),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: [...ordersQueryKey, "detail", orderId],
    queryFn: () => fetchOrder(orderId),
    retry: false,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });
}

export function useOrderableShops() {
  return useQuery({
    queryKey: ["orders", "orderable-shops"],
    queryFn: fetchOrderableShops,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrderCatalogue() {
  return useQuery({
    queryKey: ["orders", "catalogue"],
    queryFn: fetchOrderCatalogue,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHierarchyNames() {
  return useQuery({
    queryKey: ["orders", "hierarchy-names"],
    queryFn: fetchHierarchyNames,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useCheckIn(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckInInput) => checkInAtShop(orderId, input),
    // A rejected check-in is stored too, so refresh either way.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [...ordersQueryKey, "detail", orderId] }),
  });
}

export function useRecordPayment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => recordCashPayment(orderId, amount),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });
}

/** US-E4-5: agency approval; refreshes the list too, since the status changes. */
export function useDecideApproval(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      decision,
      reason,
    }: {
      decision: ApprovalDecision;
      reason?: string | undefined;
    }) => decideApproval(orderId, decision, reason),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });
}

/** US-E4-5: shop cancellation; a refused attempt refreshes too (the window may have closed). */
export function useCancelOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) => cancelOrder(orderId, reason),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });
}
