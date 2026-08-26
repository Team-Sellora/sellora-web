import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignAreaManager, fetchAreaManagers, fetchProvinces } from "./api";

export const provincesQueryKey = ["provinces"] as const;
export const areaManagersQueryKey = ["area-managers"] as const;

export function useProvinces() {
  return useQuery({ queryKey: provincesQueryKey, queryFn: fetchProvinces });
}

export function useAreaManagers() {
  return useQuery({ queryKey: areaManagersQueryKey, queryFn: fetchAreaManagers });
}

export function useAssignAreaManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { provinceId: string; areaManagerId: string }) =>
      assignAreaManager(vars.provinceId, vars.areaManagerId),
    onSuccess: () => {
      // Refetch the list so the new manager appears immediately.
      queryClient.invalidateQueries({ queryKey: provincesQueryKey });
    },
  });
}