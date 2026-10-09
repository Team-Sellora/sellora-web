import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { DeliveryDetailPage } from "@/features/deliveries/DeliveryDetailPage";

export const Route = createFileRoute("/deliveries_/$deliveryId")({
  head: () => ({
    meta: [
      { title: "Delivery Details — Sellora" },
    ],
  }),
  component: () => (
    <RouteGuard>
      <DeliveryDetailPage />
    </RouteGuard>
  ),
});
