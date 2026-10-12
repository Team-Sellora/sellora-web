import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { postDeliveryLocation } from "./api";
import { deliveriesQueryKey } from "./hooks";
import { DeliveryApiError, type DeliveryStatus, type PostDeliveryLocationPayload } from "./types";

const MIN_POST_INTERVAL_MS = 30_000;

export interface UseRepLocationSharingParams {
  deliveryJobId: string;
  status: DeliveryStatus;
  isActive: boolean;
}

export interface UseRepLocationSharingResult {
  isSharing: boolean;
  permissionDenied: boolean;
  unsupported: boolean;
  nonFatalError: string | null;
}

export function useRepLocationSharing({
  deliveryJobId,
  status,
  isActive,
}: UseRepLocationSharingParams): UseRepLocationSharingResult {
  const queryClient = useQueryClient();

  const [sharingStatus, setSharingStatus] = useState<
    "idle" | "sharing" | "permission-denied" | "unsupported" | "stopped"
  >("idle");
  const [nonFatalError, setNonFatalError] = useState<string | null>(null);

  const latestFixRef = useRef<GeolocationPosition | null>(null);
  const lastPostedFixRef = useRef<GeolocationPosition | null>(null);
  const lastPostTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPostingRef = useRef<boolean>(false);
  const stoppedRef = useRef<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || status !== "InTransit") {
      setSharingStatus("idle");
      return;
    }

    stoppedRef.current = false;
    latestFixRef.current = null;
    lastPostedFixRef.current = null;
    lastPostTimeRef.current = 0;
    setNonFatalError(null);

    // Geolocation check
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation ||
      (typeof window !== "undefined" && window.isSecureContext === false)
    ) {
      setSharingStatus("unsupported");
      return;
    }

    setSharingStatus("sharing");

    const clearAll = () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const maybePostFix = async () => {
      if (stoppedRef.current || isPostingRef.current) return;
      const fix = latestFixRef.current;
      if (!fix) return;
      if (fix === lastPostedFixRef.current) return;

      const now = Date.now();
      const elapsed = now - lastPostTimeRef.current;

      if (lastPostTimeRef.current > 0 && elapsed < MIN_POST_INTERVAL_MS) {
        if (!timerRef.current) {
          const waitTime = MIN_POST_INTERVAL_MS - elapsed;
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            void maybePostFix();
          }, waitTime);
        }
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      isPostingRef.current = true;
      const payload: PostDeliveryLocationPayload = {
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
        ...(typeof fix.coords.accuracy === "number"
          ? { accuracyMeters: Math.round(fix.coords.accuracy) }
          : {}),
        // capturedAt is the fix's own timestamp converted to ISO UTC, not the send time
        capturedAt: new Date(fix.timestamp).toISOString(),
      };

      try {
        await postDeliveryLocation(deliveryJobId, payload);
        if (stoppedRef.current) return;
        lastPostedFixRef.current = fix;
        lastPostTimeRef.current = Date.now();
        setNonFatalError(null);
      } catch (err) {
        if (stoppedRef.current) return;

        if (err instanceof DeliveryApiError) {
          // Stop on 403, 404, or 409
          if (err.status === 403 || err.status === 404 || err.status === 409) {
            stoppedRef.current = true;
            clearAll();
            if (err.status === 409) {
              // Refresh delivery detail to reflect latest state
              queryClient.invalidateQueries({ queryKey: deliveriesQueryKey });
            }
            setSharingStatus("stopped");
            return;
          }
        }

        // Non-fatal error: record attempt timestamp so throttling still applies
        lastPostTimeRef.current = Date.now();
        lastPostedFixRef.current = fix;
        setNonFatalError("Couldn't send last update");
      } finally {
        isPostingRef.current = false;
        // Schedule if a newer fix arrived while POST was in flight
        if (
          !stoppedRef.current &&
          latestFixRef.current &&
          latestFixRef.current !== lastPostedFixRef.current
        ) {
          if (!timerRef.current) {
            const nextWait = Math.max(
              0,
              MIN_POST_INTERVAL_MS - (Date.now() - lastPostTimeRef.current),
            );
            timerRef.current = setTimeout(() => {
              timerRef.current = null;
              void maybePostFix();
            }, nextWait);
          }
        }
      }
    };

    const handleSuccess = (position: GeolocationPosition) => {
      if (stoppedRef.current) return;
      latestFixRef.current = position;
      void maybePostFix();
    };

    const handleError = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        stoppedRef.current = true;
        clearAll();
        setSharingStatus("permission-denied");
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 10_000,
    });

    return () => {
      stoppedRef.current = true;
      clearAll();
    };
  }, [deliveryJobId, status, isActive, queryClient]);

  return {
    isSharing: sharingStatus === "sharing",
    permissionDenied: sharingStatus === "permission-denied",
    unsupported: sharingStatus === "unsupported",
    nonFatalError,
  };
}
