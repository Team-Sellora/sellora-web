import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrder,
  fetchHierarchyNames,
  fetchOrder,
  fetchOrderableShops,
  fetchOrderCatalogue,
  fetchOrders,
} from "./api";
import type { CreateOrderInput, OrderListQuery } from "./types";

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
