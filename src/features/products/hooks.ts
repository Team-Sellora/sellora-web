import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deactivateProduct, fetchProducts } from "./api";
import type { ProductListQuery } from "./types";

export const productsQueryKey = ["products"] as const;

export function useProducts(query: ProductListQuery) {
  return useQuery({
    queryKey: [...productsQueryKey, query],
    queryFn: () => fetchProducts(query),
    placeholderData: keepPreviousData,
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsQueryKey }),
  });
}
