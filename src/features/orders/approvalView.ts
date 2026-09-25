import type { SelloraRole } from "@/auth/useSelloraAuth";
import type { Order } from "./types";

/** US-E4-5: only the agency operator decides, only on a scheduled delivery awaiting approval. */
export function canDecideApproval(role: SelloraRole | null, order: Order): boolean {
  return (
    role === "AgencyOperator" &&
    order.fulfilmentType === "ScheduledDelivery" &&
    order.status === "PendingApproval"
  );
}

/** A rejection must say why; mirrors the server's 400 so the form can say it first. */
export function rejectionReasonError(reason: string): string | null {
  const trimmed = reason.trim();

  if (trimmed.length === 0) {
    return "Enter a reason for rejecting this order.";
  }

  return trimmed.length > 500 ? "Keep the reason under 500 characters." : null;
}

const decisionLabels: Record<string, string> = {
  Approved: "Approved by the agency",
  Rejected: "Rejected by the agency",
  CancelledByShop: "Cancelled by the shop",
};

export function formatDecision(decision: string): string {
  return decisionLabels[decision] ?? decision;
}
