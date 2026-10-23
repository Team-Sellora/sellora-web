import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  changeProductPrice,
  deactivateProduct,
  fetchActiveCategories,
  fetchProduct,
  fetchProductPriceHistory,
  fetchProducts,
  updateProduct,
} from "./api";

import type {
  ChangeProductPriceInput,
  CreateProductInput,
  ProductListQuery,
  UpdateProductInput,
} from "./types";

export const productsQueryKey = ["products"] as const;

export function useActiveCategories() {
  return useQuery({
    queryKey: ["categories", "active"],
    queryFn: fetchActiveCategories,
    staleTime: 60_000,
  });
}

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

export function useProductPriceHistory(productId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...productsQueryKey, productId, "price-history"],
    queryFn: () => fetchProductPriceHistory(productId),
    enabled: enabled && productId.length > 0,
  });
}

export function useChangeProductPrice(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangeProductPriceInput) => changeProductPrice(productId, input),
    onSuccess: (product) => {
      queryClient.setQueryData([...productsQueryKey, productId], product);
      queryClient.invalidateQueries({
        queryKey: [...productsQueryKey, productId, "price-history"],
      });
      queryClient.invalidateQueries({ queryKey: productsQueryKey });
    },
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
