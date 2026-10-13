import { useSelloraAuth } from "@/auth/useSelloraAuth";
import type { DeliveryDetail } from "../types";
import { isCallerAssignedRep } from "../trackingAccess";
import { useRepLocationSharing } from "../useRepLocationSharing";

export interface RepLocationSharingProps {
  delivery: DeliveryDetail;
}

export function RepLocationSharing({ delivery }: Readonly<RepLocationSharingProps>) {
  const auth = useSelloraAuth();
  const isActive = isCallerAssignedRep(delivery, auth) && delivery.status === "InTransit";

  const { isSharing, permissionDenied, unsupported, nonFatalError } = useRepLocationSharing({
    deliveryJobId: delivery.id,
    status: delivery.status,
    isActive,
  });

  if (!isActive) {
    return null;
  }

  if (permissionDenied || unsupported) {
    return (
      <div className="pt-2">
        <p className="text-xs text-muted-foreground">
          Location sharing is off. Allow location access in your browser.
        </p>
      </div>
    );
  }

  if (!isSharing) {
    return null;
  }

  return (
    <div className="pt-2 space-y-1">
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        Sharing location
      </div>
      {nonFatalError && <p className="text-xs text-muted-foreground">{nonFatalError}</p>}
    </div>
  );
}
