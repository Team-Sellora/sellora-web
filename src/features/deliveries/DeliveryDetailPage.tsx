import { Link, useParams } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useDelivery } from "./hooks";
import { DeliveryStatusBadge } from "./components/DeliveryStatusBadge";
import { DeliveryStatusActions } from "./components/DeliveryStatusActions";
import { DeliveryStatusHistory } from "./components/DeliveryStatusHistory";
import { AssignDeliveryDialog } from "./components/AssignDeliveryDialog";
import { Route } from "@/routes/deliveries_.$deliveryId";

export function DeliveryDetailPage() {
  const { deliveryId } = Route.useParams();
  const deliveryQuery = useDelivery(deliveryId);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  if (deliveryQuery.isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading delivery details...
      </div>
    );
  }

  if (deliveryQuery.isError || !deliveryQuery.data) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load delivery details.
      </div>
    );
  }

  const delivery = deliveryQuery.data;

  return (
    <>
      <div className="mb-4">
        <Link
          to="/deliveries"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 size-4" />
          Back to Deliveries
        </Link>
      </div>

      <PageHeader
        title={`Delivery ${delivery.deliveryReference}`}
        description={`For order ${delivery.orderReference} to ${delivery.shopName}`}
        crumbs={[
          { label: "Deliveries", to: "/deliveries" },
          { label: delivery.deliveryReference },
        ]}
        actions={
          delivery.status === "Pending" ? (
            <Button onClick={() => setIsAssignOpen(true)}>Assign Delivery</Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Delivery Lines</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                    <th className="px-4 py-3 font-semibold text-right">Returnable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {delivery.lines?.map((line) => (
                    <tr key={line.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3">{line.productName}</td>
                      <td className="px-4 py-3 text-right">{line.quantity}</td>
                      <td className="px-4 py-3 text-right">{line.returnableQuantity}</td>
                    </tr>
                  ))}
                  {(!delivery.lines || delivery.lines.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                        No lines found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Delivery History</h3>
            <DeliveryStatusHistory history={delivery.history || []} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Status</h3>
            <div className="mb-6">
              <DeliveryStatusBadge status={delivery.status} />
            </div>
            
            <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Actions</h4>
            <DeliveryStatusActions
              deliveryJobId={delivery.id}
              currentStatus={delivery.status}
            />
          </section>

          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Details</h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Scheduled Date</dt>
                <dd className="font-medium">
                  {delivery.scheduledDate
                    ? new Date(delivery.scheduledDate).toLocaleDateString()
                    : "Unscheduled"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assigned Rep</dt>
                <dd className="font-medium">{delivery.assignedRepName || "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Territory</dt>
                <dd className="font-medium">{delivery.territory}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <AssignDeliveryDialog
        isOpen={isAssignOpen}
        deliveryJobId={delivery.id}
        onClose={() => setIsAssignOpen(false)}
      />
    </>
  );
}
