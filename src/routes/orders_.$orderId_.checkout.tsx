import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { OrderCheckoutPage } from "@/features/orders/OrderCheckoutPage";

export const Route = createFileRoute("/orders_/$orderId_/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Sellora" },
      { name: "description", content: "Check in at the shop and record a cash payment." },
    ],
  }),
  component: OrderCheckoutRoute,
});

function OrderCheckoutRoute() {
  const { orderId } = Route.useParams();

  return (
    <RouteGuard>
      <OrderCheckoutPage orderId={orderId} />
    </RouteGuard>
  );
}
