import { Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { useDeliveries } from "@/features/deliveries/hooks";
import { DeliveryStatusBadge } from "@/features/deliveries/components/DeliveryStatusBadge";
import { deliveryColumnsFor } from "@/features/deliveries/roleView";

export function DeliveryTrackingPanel({ orderId }: { orderId: string }) {
  const { role } = useSelloraAuth();
  const columns = deliveryColumnsFor(role);
  const { data, isLoading, isError } = useDeliveries({
    orderId,
    page: 1,
    pageSize: 1,
  });

  const delivery = data?.items?.[0];

  return (
    <section className="mt-6 rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border p-4 text-sm font-medium flex items-center gap-2">
        <Truck className="size-4 text-primary" />
        Fulfilment Tracking
      </div>
      
      <div className="p-4 text-sm">
        {isLoading && <p className="text-muted-foreground">Loading delivery information...</p>}
        {isError && <p className="text-destructive">Failed to load delivery information.</p>}
        {!isLoading && !isError && !delivery && (
          <p className="text-muted-foreground">No delivery job found for this order.</p>
        )}
        
        {delivery && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {columns.includes("deliveryRef") && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Delivery Ref</div>
                  <div className="font-mono font-medium">{delivery.deliveryReference}</div>
                </div>
              )}
              {columns.includes("status") && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <DeliveryStatusBadge status={delivery.status} />
                </div>
              )}
              {columns.includes("date") && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Scheduled Date</div>
                  <div className="font-medium">
                    {delivery.scheduledDate
                      ? new Date(delivery.scheduledDate).toLocaleDateString()
                      : "Unscheduled"}
                  </div>
                </div>
              )}
              {columns.includes("rep") && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Sales Rep</div>
                  <div className="font-medium">{delivery.assignedRepName || "Unassigned"}</div>
                </div>
              )}
            </div>
            
            <Link
              to="/deliveries/$deliveryId"
              params={{ deliveryId: delivery.id }}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground shrink-0"
            >
              View full delivery details
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
