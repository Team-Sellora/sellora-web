import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Truck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useDeliveries } from "./hooks";
import {
  deliveryColumnsFor,
  deliveryListDescription,
  deliveryListTitle,
  emptyDeliveriesMessage,
  type DeliveryColumn,
} from "./roleView";
import type { DeliverySummary } from "./types";
import { DeliveryStatusBadge } from "./components/DeliveryStatusBadge";
import { AssignDeliveryDialog } from "./components/AssignDeliveryDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 20;

const headers: Record<DeliveryColumn, { label: string; align?: "right" }> = {
  deliveryRef: { label: "Delivery Ref" },
  orderRef: { label: "Order Ref" },
  shop: { label: "Shop" },
  territory: { label: "Territory" },
  status: { label: "Status" },
  date: { label: "Scheduled Date" },
  rep: { label: "Sales Rep" },
  assign: { label: "Action", align: "right" },
};

function formatDeliveryDate(dateString: string | null): string {
  if (!dateString) return "Unscheduled";
  // Just use a simple date formatter or locale string
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DeliveryQueuePage() {
  const { role } = useSelloraAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [repFilter, setRepFilter] = useState<string>("");
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);

  const isAgencyRole =
    role === "CompanyAdmin" || role === "AreaManager" || role === "AgencyOperator";

  const deliveriesQuery = useDeliveries({
    page,
    pageSize: PAGE_SIZE,
    ...(statusFilter !== "all" ? { status: [statusFilter] } : {}),
    ...(dateFrom ? { scheduledDateFrom: dateFrom } : {}),
    ...(dateTo ? { scheduledDateTo: dateTo } : {}),
    ...(repFilter ? { salesRepId: repFilter } : {}),
  });

  const columns = deliveryColumnsFor(role);
  const deliveries = deliveriesQuery.data?.items ?? [];
  const totalCount = deliveriesQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const cell = (delivery: DeliverySummary, column: DeliveryColumn): ReactNode => {
    switch (column) {
      case "deliveryRef":
        return (
          <Link
            to="/deliveries/$deliveryId"
            params={{ deliveryId: delivery.id }}
            className="font-mono text-xs font-semibold text-foreground hover:text-primary hover:underline"
          >
            {delivery.deliveryReference}
          </Link>
        );
      case "orderRef":
        return (
          <Link
            to="/orders/$orderId"
            params={{ orderId: delivery.orderId }}
            className="font-mono text-xs hover:underline"
          >
            {delivery.orderReference}
          </Link>
        );
      case "shop":
        return delivery.shopName;
      case "territory":
        return delivery.territory;
      case "status":
        return <DeliveryStatusBadge status={delivery.status} />;
      case "date":
        return formatDeliveryDate(delivery.scheduledDate);
      case "rep":
        return delivery.assignedRepName || <span className="text-muted-foreground">Unassigned</span>;
      case "assign":
        // Render assign action if pending. The AssignDeliveryDialog's internal gate
        // handles whether the button actually functions or opens based on role.
        return delivery.status === "Pending" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssigningJobId(delivery.id)}
          >
            Assign
          </Button>
        ) : null;
    }
  };

  const renderRows = () => {
    if (deliveriesQuery.isLoading) {
      return (
        <tr>
          <td colSpan={columns.length} className="px-4 py-6 text-center text-muted-foreground">
            Loading deliveries…
          </td>
        </tr>
      );
    }

    if (deliveries.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="px-4 py-14 text-center text-muted-foreground">
            <Truck className="mx-auto mb-2 size-6" />
            {emptyDeliveriesMessage(role)}
          </td>
        </tr>
      );
    }

    return deliveries.map((delivery) => (
      <tr key={delivery.id} className="hover:bg-muted/40">
        {columns.map((column) => (
          <td
            key={column}
            className={cn(
              "whitespace-nowrap px-4 py-3",
              headers[column].align === "right" && "text-right",
            )}
          >
            {cell(delivery, column)}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <>
      <PageHeader
        title={deliveryListTitle(role)}
        description={deliveryListDescription(role)}
        crumbs={[{ label: deliveryListTitle(role) }]}
      />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-4 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <span className="text-sm font-medium">Delivery queue</span>
            {isAgencyRole && (
              <>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="InTransit">In Transit</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    className="h-8 text-xs w-[145px]"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    aria-label="From Date"
                  />
                  <span className="text-muted-foreground text-xs">-</span>
                  <Input
                    type="date"
                    className="h-8 text-xs w-[145px]"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    aria-label="To Date"
                  />
                </div>
                <Input
                  placeholder="Sales Rep ID"
                  className="h-8 text-xs w-[140px]"
                  value={repFilter}
                  onChange={(e) => {
                    setRepFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {totalCount} {totalCount === 1 ? "delivery" : "deliveries"}
          </span>
        </div>

        {deliveriesQuery.isError && (
          <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {deliveriesQuery.error instanceof Error
              ? deliveriesQuery.error.message
              : "Deliveries could not be loaded."}
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
              disabled={page <= 1 || deliveriesQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-3 disabled:opacity-50"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || deliveriesQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-3 disabled:opacity-50"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {assigningJobId && (
        <AssignDeliveryDialog
          isOpen={!!assigningJobId}
          deliveryJobId={assigningJobId}
          onClose={() => setAssigningJobId(null)}
        />
      )}
    </>
  );
}
