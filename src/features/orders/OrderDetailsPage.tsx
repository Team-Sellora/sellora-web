import { Link } from "@tanstack/react-router";
import { AlertCircle, Banknote, CalendarClock, Lock, Store, User, Warehouse } from "lucide-react";
import type { ReactNode } from "react";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { formatLkr, formatOrderDate, shortId } from "./format";
import { useHierarchyNames, useOrder } from "./hooks";
import { FulfilmentTypeBadge, OrderStatusBadge } from "./OrderStatusBadge";
import { orderColumnsFor } from "./roleView";
import { OrderApiError } from "./types";

function InfoCard({
  icon,
  label,
  value,
}: Readonly<{ icon: ReactNode; label: string; value: ReactNode }>) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 font-medium">{value}</div>
    </div>
  );
}

export function OrderDetailsPage({ orderId }: Readonly<{ orderId: string }>) {
  const { role } = useSelloraAuth();
  const orderQuery = useOrder(orderId);
  const namesQuery = useHierarchyNames();
  const columns = orderColumnsFor(role);

  const crumbs = [{ label: "Orders", to: "/orders" }, { label: "Order details" }];

  if (orderQuery.isLoading) {
    return (
      <>
        <PageHeader title="Order details" crumbs={crumbs} />
        <p className="text-sm text-muted-foreground">Loading order…</p>
      </>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    const notFound = orderQuery.error instanceof OrderApiError && orderQuery.error.status === 404;

    return (
      <>
        <PageHeader title="Order details" crumbs={crumbs} />
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p>
              {notFound
                ? "This order does not exist or is not visible to you."
                : orderQuery.error instanceof Error
                  ? orderQuery.error.message
                  : "The order could not be loaded."}
            </p>
            <Link to="/orders" className="mt-2 inline-block font-medium underline">
              Back to orders
            </Link>
          </div>
        </div>
      </>
    );
  }

  const order = orderQuery.data;
  const shopName = namesQuery.data?.shops[order.shopId] ?? shortId(order.shopId);
  const agencyName = namesQuery.data?.agencies[order.agencyId] ?? shortId(order.agencyId);

  return (
    <>
      <PageHeader
        title={order.orderReference}
        description="Submitted orders are read-only."
        crumbs={[{ label: "Orders", to: "/orders" }, { label: order.orderReference }]}
        actions={
          <div className="flex items-center gap-2">
            <FulfilmentTypeBadge type={order.fulfilmentType} />
            <OrderStatusBadge status={order.status} />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<CalendarClock className="size-4" />}
          label="Order date"
          value={formatOrderDate(order.orderDate)}
        />
        {columns.includes("shop") && (
          <InfoCard icon={<Store className="size-4" />} label="Shop" value={shopName} />
        )}
        {columns.includes("salesRep") && (
          <InfoCard
            icon={<User className="size-4" />}
            label="Sales rep"
            value={<span className="font-mono text-sm">{shortId(order.salesRepId)}</span>}
          />
        )}
        {columns.includes("agency") && (
          <InfoCard icon={<Warehouse className="size-4" />} label="Agency" value={agencyName} />
        )}
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 text-sm font-medium">
          Order lines ({order.lines.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 text-right font-semibold">Qty</th>
                <th className="px-4 py-3 text-right font-semibold">Unit price</th>
                <th className="px-4 py-3 text-right font-semibold">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {order.lines.map((line) => (
                <tr key={line.orderLineId}>
                  <td className="px-4 py-3 font-medium">{line.productNameSnapshot}</td>
                  <td className="px-4 py-3 text-right font-mono">{line.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatLkr(line.unitPriceSnapshot)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    {formatLkr(line.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-muted/30">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">
                  Subtotal
                </td>
                <td className="px-4 py-2 text-right font-mono">{formatLkr(order.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                  Total
                </td>
                <td className="px-4 py-3 text-right font-mono text-base font-semibold">
                  {formatLkr(order.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {order.status === "AwaitingCheckout" && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <Banknote className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            This cash sale is not finished. The stock is held in your van until you check in at the
            shop and record the payment.
          </p>
        </div>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          Names and prices are snapshots taken when the order was placed. Later catalogue changes do
          not alter this order.
        </p>
      </div>
    </>
  );
}
