import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignDelivery, fetchEligibleReps, updateDeliveryStatus } from "./api";
import type { AssignDeliveryPayload, UpdateDeliveryStatusPayload } from "./types";

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

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryJobId,
      payload,
    }: {
      deliveryJobId: string;
      payload: UpdateDeliveryStatusPayload;
    }) => updateDeliveryStatus(deliveryJobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKey });
    },
  });
}
