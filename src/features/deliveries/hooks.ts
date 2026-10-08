import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignDelivery, fetchEligibleReps } from "./api";
import type { AssignDeliveryPayload } from "./types";

export const deliveriesQueryKey = ["deliveries"] as const;

export function useEligibleReps(deliveryJobId: string) {
  return useQuery({
    queryKey: [...deliveriesQueryKey, deliveryJobId, "eligible-reps"],
    queryFn: () => fetchEligibleReps(deliveryJobId),
    enabled: !!deliveryJobId,
  });
}

export function useAssignDeliveryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryJobId,
      payload,
    }: {
      deliveryJobId: string;
      payload: AssignDeliveryPayload;
    }) => assignDelivery(deliveryJobId, payload),
    onSuccess: () => {
      // Invalidate the deliveries list and the specific delivery job
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKey });
    },
  });
}
