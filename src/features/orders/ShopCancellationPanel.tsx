import { Loader2, TimerReset, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { canShopCancel, formatCountdown, secondsLeft } from "./cancellationWindow";
import { useCancelOrder } from "./hooks";
import { OrderApiError, type Order } from "./types";

/**
 * US-E4-5: the shop owner's cancel action with the time left. The server
 * computes the window; this only counts it down between refreshes, and asks
 * the server again when it reaches zero.
 */
export function ShopCancellationPanel({
  order,
  receivedAt,
  onExpired,
}: Readonly<{ order: Order; receivedAt: number; onExpired: () => void }>) {
  const cancel = useCancelOrder(order.orderId);
  const [now, setNow] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  const left = secondsLeft(order.cancellation, receivedAt, now);

  useEffect(() => {
    if (left == null) {
      return;
    }
    if (left === 0) {
      onExpired();
      return;
    }
    const timer = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(timer);
  }, [left, onExpired]);

  if (!order.cancellation) {
    return null;
  }

  if (!canShopCancel("ShopOwner", order) || left === 0) {
    // Window closed or not cancellable: say why, once.
    return order.status === "Cancelled" || !order.cancellation.reason ? null : (
      <p className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        {order.cancellation.reason}
      </p>
    );
  }

  async function submit() {
    try {
      await cancel.mutateAsync(reason);
      toast.success(`Order ${order.orderReference} cancelled. The stock is being returned.`);
      setConfirming(false);
    } catch (error) {
      const body = error instanceof OrderApiError ? error.body : undefined;
      toast.error(
        body?.closedAgo
          ? `Too late — the cancellation window closed ${body.closedAgo} ago.`
          : error instanceof Error
            ? error.message
            : "The order could not be cancelled.",
      );
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
      <div className="flex items-start gap-3">
        <TimerReset className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1">
          {left != null ? (
            <p>
              You can cancel this order for another{" "}
              <strong className="font-mono" aria-live="polite">
                {formatCountdown(left)}
              </strong>{" "}
              ({order.cancellation.windowMinutes} minutes from confirmation).
            </p>
          ) : (
            <p>
              This order is not confirmed yet, so you can cancel it. Once it is confirmed you will
              have {order.cancellation.windowMinutes} minutes.
            </p>
          )}

          {confirming && (
            <div className="mt-3">
              <label
                htmlFor="cancel-reason"
                className="text-xs font-medium uppercase tracking-wide"
              >
                Reason (optional)
              </label>
              <textarea
                id="cancel-reason"
                value={reason}
                maxLength={500}
                rows={2}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={cancel.isPending}
              onClick={() => (confirming ? submit() : setConfirming(true))}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-destructive px-3 font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
            >
              {cancel.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              {confirming ? "Confirm cancellation" : "Cancel order"}
            </button>
            {confirming && (
              <button
                type="button"
                disabled={cancel.isPending}
                onClick={() => setConfirming(false)}
                className="inline-flex h-9 items-center rounded-md px-3 text-muted-foreground hover:bg-muted"
              >
                Keep order
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
