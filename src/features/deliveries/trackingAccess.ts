import type { SelloraRole } from "@/auth/useSelloraAuth";
import type { DeliveryDetail, DeliverySummary } from "./types";

export interface ViewerAuthInfo {
  role: SelloraRole | null;
  username?: string | null;
  userId?: string | null;
}

export const LIVE_TRACKING_VIEWER_ROLES: readonly SelloraRole[] = [
  "ShopOwner",
  "AgencyOperator",
  "AreaManager",
  "CompanyAdmin",
] as const;

export function isLiveTrackingViewer(role: SelloraRole | null): boolean {
  return role !== null && (LIVE_TRACKING_VIEWER_ROLES as readonly (string | null)[]).includes(role);
}

export function isAssignedRep(
  delivery: Pick<DeliverySummary | DeliveryDetail, "assignedRepName"> & {
    assignedRepId?: string | null;
    salesRepId?: string | null;
  },
  auth: ViewerAuthInfo,
): boolean {
  if (auth.role !== "SalesRep") {
    return false;
  }

  // If a specific rep ID is present on the delivery, ensure it matches the user
  const repId = delivery.assignedRepId ?? delivery.salesRepId;
  if (repId) {
    if (auth.userId) {
      return auth.userId === repId;
    }
    if (auth.username) {
      return auth.username === repId || auth.username === delivery.assignedRepName;
    }
    return false;
  }

  // If only assignedRepName is present, check against username
  if (delivery.assignedRepName && auth.username) {
    return auth.username === delivery.assignedRepName;
  }

  return true;
}

/**
 * Whether the signed-in user is the Sales Rep assigned to this delivery.
 * Prefers the server's answer (isAssignedToCaller); falls back to the local
 * comparison only for an older API that does not send it yet.
 */
export function isCallerAssignedRep(
  delivery: Parameters<typeof isAssignedRep>[0] & { isAssignedToCaller?: boolean | undefined },
  auth: ViewerAuthInfo,
): boolean {
  if (auth.role !== "SalesRep") {
    return false;
  }
  if (typeof delivery.isAssignedToCaller === "boolean") {
    return delivery.isAssignedToCaller;
  }
  return isAssignedRep(delivery, auth);
}
