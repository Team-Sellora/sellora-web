import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignDelivery,
  fetchEligibleReps,
  updateDeliveryStatus,
  getDeliveries,
  getDelivery,
  submitDeliveryConfirmation,
  fetchDeliveryLocation,
  type GetDeliveriesParams,
} from "./api";
import type {
  AssignDeliveryPayload,
  UpdateDeliveryStatusPayload,
  SubmitDeliveryConfirmationPayload,
} from "./types";

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

export function useDeliveries(params: GetDeliveriesParams) {
  return useQuery({
    queryKey: [...deliveriesQueryKey, "list", params],
    queryFn: () => getDeliveries(params),
  });
}

export function useDelivery(deliveryJobId: string) {
  return useQuery({
    queryKey: [...deliveriesQueryKey, "detail", deliveryJobId],
    queryFn: () => getDelivery(deliveryJobId),
    enabled: !!deliveryJobId,
  });
}

export function useSubmitDeliveryConfirmation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryJobId,
      payload,
    }: {
      deliveryJobId: string;
      payload: SubmitDeliveryConfirmationPayload;
    }) => submitDeliveryConfirmation(deliveryJobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKey });
    },
  });
}

export { useRepLocationSharing } from "./useRepLocationSharing";

export function useDeliveryLocation(deliveryJobId: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const isEnabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: [...deliveriesQueryKey, "location", deliveryJobId],
    queryFn: () => fetchDeliveryLocation(deliveryJobId),
    enabled: Boolean(deliveryJobId) && isEnabled,
    refetchInterval: (q) =>
      q.state.data?.status === "InTransit" || (!q.state.data && isEnabled) ? 30_000 : false,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (query.data && query.data.status !== "InTransit") {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKey });
    }
  }, [query.data, queryClient]);

  return query;
}
