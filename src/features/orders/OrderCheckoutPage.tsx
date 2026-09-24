import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Loader2,
  LocateFixed,
  MapPinOff,
  Navigation,
} from "lucide-react";
import { useState, type ReactNode, type SubmitEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { productInputClass } from "@/features/products/productFormStyles";
import { formatLkr, formatOrderDate } from "./format";
import { getDevicePosition } from "./geolocation";
import { useCheckIn, useOrder, useRecordPayment } from "./hooks";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderApiError, type CheckIn, type Order } from "./types";

/** GPS accuracy worse than this is flagged before the rep relies on it. */
const POOR_ACCURACY_METERS = 100;

type CheckInState =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "accepted"; checkIn: CheckIn; accuracyMeters: number | null }
  | { kind: "outside"; distanceMeters: number; radiusMeters: number; accuracyMeters: number }
  | { kind: "error"; message: string };

function validCheckIn(order: Order): CheckIn | null {
  const latest = order.checkout?.latestCheckIn;
  return latest?.accepted && latest.validUntil && new Date(latest.validUntil) > new Date()
    ? latest
    : null;
}

export function OrderCheckoutPage({ orderId }: Readonly<{ orderId: string }>) {
  const orderQuery = useOrder(orderId);
  const crumbs = [{ label: "Orders", to: "/orders" }, { label: "Checkout" }];

  if (orderQuery.isLoading) {
    return (
      <>
        <PageHeader title="Checkout" crumbs={crumbs} />
        <p className="text-sm text-muted-foreground">Loading order…</p>
      </>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <>
        <PageHeader title="Checkout" crumbs={crumbs} />
        <Banner tone="error" icon={<AlertCircle className="size-4" />}>
          {orderQuery.error instanceof Error
            ? orderQuery.error.message
            : "The order could not be loaded."}
        </Banner>
      </>
    );
  }

  const order = orderQuery.data;

  return (
    <>
      <PageHeader
        title={`Checkout · ${order.orderReference}`}
        description="Check in at the shop, then record the cash payment."
        crumbs={crumbs}
        actions={<OrderStatusBadge status={order.status} />}
      />
      {order.status === "AwaitingCheckout" ? (
        <CheckoutFlow order={order} />
      ) : (
        <CheckoutClosed order={order} />
      )}
    </>
  );
}

function CheckoutFlow({ order }: Readonly<{ order: Order }>) {
  const navigate = useNavigate();
  const checkInMutation = useCheckIn(order.orderId);
  const paymentMutation = useRecordPayment(order.orderId);

  const existing = validCheckIn(order);
  const [state, setState] = useState<CheckInState>(() =>
    existing ? { kind: "accepted", checkIn: existing, accuracyMeters: null } : { kind: "idle" },
  );
  const [amount, setAmount] = useState(order.total.toFixed(2));
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const checkIn = async () => {
    setState({ kind: "locating" });

    let position;
    try {
      position = await getDevicePosition();
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Location unavailable.",
      });
      return;
    }

    try {
      const result = await checkInMutation.mutateAsync({
        latitude: position.latitude,
        longitude: position.longitude,
        capturedAt: position.capturedAt,
        accuracyMeters: position.accuracyMeters,
      });
      setState({ kind: "accepted", checkIn: result, accuracyMeters: position.accuracyMeters });
      setPaymentError(null);
    } catch (error) {
      if (
        error instanceof OrderApiError &&
        error.status === 403 &&
        error.body.distanceMeters !== undefined
      ) {
        // Show the distance, not just "failed": the rep needs to know to walk closer.
        setState({
          kind: "outside",
          distanceMeters: error.body.distanceMeters,
          radiusMeters: error.body.radiusMeters ?? 300,
          accuracyMeters: position.accuracyMeters,
        });
        return;
      }

      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "The check-in failed.",
      });
    }
  };

  const pay = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPaymentError(null);

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setPaymentError("Enter the cash amount received.");
      return;
    }

    try {
      await paymentMutation.mutateAsync(value);
      toast.success(`${formatLkr(value)} cash recorded for ${order.orderReference}.`);
      await navigate({ to: "/orders/$orderId", params: { orderId: order.orderId } });
    } catch (error) {
      if (error instanceof OrderApiError && error.status === 403) {
        // Missing or expired check-in: send the rep back to step 1.
        setState({ kind: "error", message: error.message });
        return;
      }

      setPaymentError(
        error instanceof Error ? error.message : "The payment could not be recorded.",
      );
    }
  };

  const checkedIn = state.kind === "accepted";

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <StepHeading number={1} title="Check in at the shop" done={checkedIn} />
        <p className="mt-1 text-sm text-muted-foreground">
          Your location is compared with the shop's registered location. You must be within the
          permitted radius to take payment.
        </p>

        <div className="mt-4 space-y-3">
          {state.kind === "accepted" && (
            <Banner tone="success" icon={<CheckCircle2 className="size-4" />}>
              Checked in {Math.round(state.checkIn.distanceMeters)} m from the shop (limit{" "}
              {Math.round(state.checkIn.radiusMeters)} m).
              {state.checkIn.validUntil &&
                ` Valid until ${formatOrderDate(state.checkIn.validUntil)}.`}
            </Banner>
          )}

          {state.kind === "outside" && (
            <Banner tone="warning" icon={<MapPinOff className="size-4" />}>
              <span className="font-semibold">
                You are {Math.round(state.distanceMeters)} m from the shop.
              </span>{" "}
              Move within {Math.round(state.radiusMeters)} m and check in again. The order and its
              stock are still held.
            </Banner>
          )}

          {state.kind === "error" && (
            <Banner tone="error" icon={<AlertCircle className="size-4" />}>
              {state.message}
            </Banner>
          )}

          {"accuracyMeters" in state &&
            state.accuracyMeters !== null &&
            state.accuracyMeters > POOR_ACCURACY_METERS && (
              <p className="text-xs text-muted-foreground">
                GPS accuracy is only ±{Math.round(state.accuracyMeters)} m. Step outside or wait a
                moment for a better fix.
              </p>
            )}

          <button
            type="button"
            onClick={() => void checkIn()}
            disabled={state.kind === "locating" || checkInMutation.isPending}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-60",
              checkedIn
                ? "border border-input hover:bg-muted"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {state.kind === "locating" || checkInMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : checkedIn ? (
              <LocateFixed className="size-4" />
            ) : (
              <Navigation className="size-4" />
            )}
            {state.kind === "locating"
              ? "Getting your location…"
              : checkedIn
                ? "Check in again"
                : "Get my location and check in"}
          </button>
        </div>
      </section>

      <section
        className={cn(
          "rounded-xl border border-border bg-card p-6 shadow-sm transition-opacity",
          !checkedIn && "pointer-events-none opacity-50",
        )}
        aria-disabled={!checkedIn}
      >
        <StepHeading number={2} title="Record the cash payment" done={false} />

        {checkedIn ? (
          <form onSubmit={pay} noValidate className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/60 p-3 text-sm">
              <span className="text-muted-foreground">Order total</span>
              <span className="font-mono font-semibold">{formatLkr(order.total)}</span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="amount" className="text-sm font-medium">
                Cash received (LKR)
              </label>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                aria-invalid={!!paymentError}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setPaymentError(null);
                }}
                className={cn(productInputClass(!!paymentError), "font-mono")}
              />
              <p className="text-xs text-muted-foreground">
                Cash only. The amount must equal the order total.
              </p>
            </div>

            {paymentError && (
              <Banner tone="error" icon={<AlertCircle className="size-4" />}>
                {paymentError}
              </Banner>
            )}

            <button
              type="submit"
              disabled={paymentMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {paymentMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Banknote className="size-4" />
              )}
              {paymentMutation.isPending ? "Recording…" : "Record cash payment"}
            </button>
          </form>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Available after a successful check-in.
          </p>
        )}
      </section>
    </div>
  );
}

function CheckoutClosed({ order }: Readonly<{ order: Order }>) {
  const payment = order.checkout?.payment;
  const cancelled = order.status === "Cancelled";

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-12">
      {payment ? (
        <Banner tone="success" icon={<CheckCircle2 className="size-4" />}>
          {formatLkr(payment.amount)} cash recorded on {formatOrderDate(payment.recordedAt)},{" "}
          {Math.round(payment.distanceMeters)} m from the shop.
        </Banner>
      ) : cancelled ? (
        <Banner tone="error" icon={<AlertCircle className="size-4" />}>
          {order.checkout?.cancellationReason ?? "This order was cancelled."} Place the order again
          if the shop still wants it.
        </Banner>
      ) : (
        <Banner tone="warning" icon={<AlertCircle className="size-4" />}>
          This order is not awaiting checkout.
        </Banner>
      )}
      <Link
        to="/orders/$orderId"
        params={{ orderId: order.orderId }}
        className="inline-block text-sm font-medium text-primary hover:underline"
      >
        View the order
      </Link>
    </div>
  );
}

function StepHeading({
  number,
  title,
  done,
}: Readonly<{ number: number; title: string; done: boolean }>) {
  return (
    <h2 className="flex items-center gap-3 font-semibold">
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-xs",
          done ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary",
        )}
      >
        {done ? <CheckCircle2 className="size-4" /> : number}
      </span>
      {title}
    </h2>
  );
}

const bannerTones = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  error: "border-destructive/20 bg-destructive/10 text-destructive",
} as const;

function Banner({
  tone,
  icon,
  children,
}: Readonly<{ tone: keyof typeof bannerTones; icon: ReactNode; children: ReactNode }>) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", bannerTones[tone])}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
