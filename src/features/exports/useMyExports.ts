import { useQuery } from "@tanstack/react-query";
import { listMyExports } from "./api";
import type { ExportStatusResponse } from "./types";

export const MY_EXPORTS_QUERY_KEY = ["myExports"] as const;

export function useMyExports() {
  return useQuery<ExportStatusResponse[]>({
    queryKey: MY_EXPORTS_QUERY_KEY,
    queryFn: () => listMyExports(),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.length === 0) return false;
      const hasActive = data.some((item) => item.status === "Queued" || item.status === "Running");
      return hasActive ? 6000 : false;
    },
  });
}
