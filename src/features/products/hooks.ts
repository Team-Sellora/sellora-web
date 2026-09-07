import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deactivateProduct,
  fetchProduct,
  fetchProducts,
  updateProduct,
} from "./api";

import type { CreateProductInput, ProductListQuery, UpdateProductInput } from "./types";

export const productsQueryKey = ["products"] as const;

export function useProducts(query: ProductListQuery) {
  return useQuery({
    queryKey: [...productsQueryKey, query],
    queryFn: () => fetchProducts(query),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: [...productsQueryKey, productId],
    queryFn: () => fetchProduct(productId),
    enabled: productId.length > 0,
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

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(productId, input),

    onSuccess: (product) => {
      queryClient.setQueryData([...productsQueryKey, productId], product);

      queryClient.invalidateQueries({
        queryKey: productsQueryKey,
      });
    },
  });
}
