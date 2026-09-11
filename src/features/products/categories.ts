import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogApiFetch } from "@/api/client";
import type { ProductCategory } from "./types";

export interface CategoryInput {
  name: string;
  description: string | null;
}

async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) return (await response.json()) as T;
  const body = (await response.json().catch(() => ({}))) as { message?: string };
  throw new Error(body.message ?? `Request failed with status ${response.status}`);
}

const categoriesKey = ["categories"] as const;
const fetchCategories = (status: string) =>
  catalogApiFetch(`/api/categories?status=${status}`).then(unwrap<ProductCategory[]>);

export function useCategories(status: string) {
  return useQuery({ queryKey: [...categoriesKey, status], queryFn: () => fetchCategories(status) });
}

function useCategoryMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriesKey }),
  });
}

export function useCreateCategory() {
  return useCategoryMutation<CategoryInput>((input) =>
    catalogApiFetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then(unwrap<ProductCategory>),
  );
}

export function useUpdateCategory(categoryId: string) {
  return useCategoryMutation<CategoryInput>((input) =>
    catalogApiFetch(`/api/categories/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then(unwrap<ProductCategory>),
  );
}

export function useDeactivateCategory() {
  return useCategoryMutation<string>((categoryId) =>
    catalogApiFetch(`/api/categories/${categoryId}/deactivate`, { method: "PATCH" }).then(
      unwrap<ProductCategory>,
    ),
  );
}
