import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ClipboardList, Info, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { formatLkr, formatOrderDate, shortId } from "./format";
import { useHierarchyNames, useOrders } from "./hooks";
import { FulfilmentTypeBadge, OrderStatusBadge } from "./OrderStatusBadge";
import {
  canCreateOrder,
  emptyOrdersMessage,
  orderColumnsFor,
  orderListDescription,
  type OrderColumn,
} from "./roleView";
import type { OrderSummary } from "./types";

const PAGE_SIZE = 20;

const headers: Record<OrderColumn, { label: string; align?: "right" }> = {
  reference: { label: "Reference" },
  shop: { label: "Shop" },
  salesRep: { label: "Sales rep" },
  agency: { label: "Agency" },
  date: { label: "Order date" },
  lines: { label: "Lines", align: "right" },
  total: { label: "Total", align: "right" },
  fulfilment: { label: "Type" },
  status: { label: "Status" },
};

export function OrderListPage() {
  const { role } = useSelloraAuth();
  const [page, setPage] = useState(1);
  const ordersQuery = useOrders({ page, pageSize: PAGE_SIZE });
  const namesQuery = useHierarchyNames();

  const columns = orderColumnsFor(role);
  const orders = ordersQuery.data?.items ?? [];
  const totalCount = ordersQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const shopName = (id: string) => namesQuery.data?.shops[id] ?? shortId(id);
  const agencyName = (id: string) => namesQuery.data?.agencies[id] ?? shortId(id);

  const cell = (order: OrderSummary, column: OrderColumn): ReactNode => {
    switch (column) {
      case "reference":
        return (
          <Link
            to="/orders/$orderId"
            params={{ orderId: order.orderId }}
            className="font-mono text-xs font-semibold text-foreground hover:text-primary hover:underline"
          >
            {order.orderReference}
          </Link>
        );
      case "shop":
        return shopName(order.shopId);
      case "salesRep":
        return (
          <span className="font-mono text-xs" title={order.salesRepId}>
            {shortId(order.salesRepId)}
          </span>
        );
      case "agency":
        return agencyName(order.agencyId);
      case "date":
        return formatOrderDate(order.orderDate);
      case "lines":
        return order.lineCount;
      case "total":
        return <span className="font-mono font-medium">{formatLkr(order.total)}</span>;
      case "fulfilment":
        return <FulfilmentTypeBadge type={order.fulfilmentType} />;
      case "status":
        return <OrderStatusBadge status={order.status} />;
    }
  };

  const renderRows = () => {
    if (ordersQuery.isLoading) {
      return (
        <tr>
          <td colSpan={columns.length} className="px-4 py-6 text-center text-muted-foreground">
            Loading orders…
          </td>
        </tr>
      );
    }

    if (orders.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="px-4 py-14 text-center text-muted-foreground">
            <ClipboardList className="mx-auto mb-2 size-6" />
            {emptyOrdersMessage(role)}
            {canCreateOrder(role) && (
              <div className="mt-3">
                <Link to="/orders/new" className="text-sm font-medium text-primary hover:underline">
                  Place your first order
                </Link>
              </div>
            )}
          </td>
        </tr>
      );
    }

    return orders.map((order) => (
      <tr key={order.orderId} className="hover:bg-muted/40">
        {columns.map((column) => (
          <td
            key={column}
            className={cn(
              "whitespace-nowrap px-4 py-3",
              headers[column].align === "right" && "text-right",
            )}
          >
            {cell(order, column)}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <>
      <PageHeader
        title="Orders"
        description={orderListDescription(role)}
        crumbs={[{ label: "Orders" }]}
        actions={
          canCreateOrder(role) ? (
            <Link
              to="/orders/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" />
              New Order
            </Link>
          ) : undefined
        }
      />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="text-sm font-medium">Order history</span>
          <span className="text-xs text-muted-foreground">
            {totalCount} order{totalCount === 1 ? "" : "s"}
          </span>
        </div>

        {ordersQuery.isError && (
          <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {ordersQuery.error instanceof Error
              ? ordersQuery.error.message
              : "Orders could not be loaded."}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className={cn(
                      "px-4 py-3 font-semibold",
                      headers[column].align === "right" && "text-right",
                    )}
                  >
                    {headers[column].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">{renderRows()}</tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || ordersQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-3 disabled:opacity-50"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || ordersQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-3 disabled:opacity-50"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <div className="font-semibold text-foreground">Orders cannot be edited</div>
          <p className="mt-1">
            A submitted order keeps the product names and prices recorded at the moment it was
            placed.
          </p>
        </div>
      </div>
    </>
  );
}
