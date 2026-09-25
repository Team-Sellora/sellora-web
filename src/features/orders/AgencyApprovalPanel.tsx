import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { rejectionReasonError } from "./approvalView";
import { useDecideApproval } from "./hooks";
import { OrderApiError, type Order } from "./types";

/**
 * US-E4-5: the agency operator approves a scheduled delivery, or rejects it
 * with a reason. Shown only while the order is awaiting approval.
 */
export function AgencyApprovalPanel({ order }: Readonly<{ order: Order }>) {
  const decide = useDecideApproval(order.orderId);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  async function submit(decision: "Approve" | "Reject") {
    if (decision === "Reject") {
      const error = rejectionReasonError(reason);
      setReasonError(error);
      if (error) {
        return;
      }
    }

    try {
      await decide.mutateAsync({ decision, reason: decision === "Reject" ? reason : undefined });
      toast.success(
        decision === "Approve"
          ? `Order ${order.orderReference} approved — it is now confirmed.`
          : `Order ${order.orderReference} rejected. The stock goes back to the agency.`,
      );
    } catch (error) {
      const serverReason =
        error instanceof OrderApiError ? error.body.errors?.["reason"]?.[0] : undefined;
      if (serverReason) {
        setReasonError(serverReason);
        return;
      }
      toast.error(error instanceof Error ? error.message : "The decision could not be saved.");
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
      <p className="font-medium">This scheduled delivery is waiting for your approval.</p>
      <p className="mt-1 text-muted-foreground">
        Approving makes it binding and starts the shop&apos;s one-hour cancellation window.
        Rejecting cancels it and returns the stock.
      </p>

      {rejecting && (
        <div className="mt-3">
          <label htmlFor="rejection-reason" className="text-xs font-medium uppercase tracking-wide">
            Reason for rejecting
          </label>
          <textarea
            id="rejection-reason"
            value={reason}
            maxLength={500}
            rows={3}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(null);
            }}
            aria-invalid={reasonError != null}
            aria-describedby={reasonError ? "rejection-reason-error" : undefined}
            className={cn(
              "mt-1 w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring/40",
              reasonError ? "border-destructive" : "border-input",
            )}
          />
          {reasonError && (
            <p id="rejection-reason-error" className="mt-1 text-xs text-destructive">
              {reasonError}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!rejecting && (
          <button
            type="button"
            disabled={decide.isPending}
            onClick={() => submit("Approve")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {decide.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Approve
          </button>
        )}
        <button
          type="button"
          disabled={decide.isPending}
          onClick={() => (rejecting ? submit("Reject") : setRejecting(true))}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-destructive/40 px-3 font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
        >
          <XCircle className="size-4" />
          {rejecting ? "Confirm rejection" : "Reject"}
        </button>
        {rejecting && (
          <button
            type="button"
            disabled={decide.isPending}
            onClick={() => {
              setRejecting(false);
              setReasonError(null);
            }}
            className="inline-flex h-9 items-center rounded-md px-3 text-muted-foreground hover:bg-muted"
          >
            Back
          </button>
        )}
      </div>
    </section>
  );
}
