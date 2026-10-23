import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { OrderDetailsPage } from "@/features/orders/OrderDetailsPage";

export const Route = createFileRoute("/orders_/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Details — Sellora" },
      { name: "description", content: "View an order's lines and totals." },
    ],
  }),
  component: OrderDetailsRoute,
});

function OrderDetailsRoute() {
  const { orderId } = Route.useParams();

  return (
    <RouteGuard>
      <OrderDetailsPage orderId={orderId} />
    </RouteGuard>
  );
}
