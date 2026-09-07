import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduct, deactivateProduct, fetchProducts } from "./api";

import type { CreateProductInput, ProductListQuery } from "./types";

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

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: productsQueryKey,
      }),
  });
}
