import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFailedNotifications, resendNotification } from "./api";
import type { CorrectedAddress } from "./types";

export const notificationsQueryKey = ["notifications"] as const;

export function useFailedNotifications(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...notificationsQueryKey, "failed", page, pageSize],
    queryFn: () => fetchFailedNotifications(page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useResendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, corrected }: { id: string; corrected: CorrectedAddress[] }) =>
      resendNotification(id, corrected),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      // The dashboard's count comes from the same service.
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
