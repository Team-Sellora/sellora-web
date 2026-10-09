import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { DeliveryQueuePage } from "@/features/deliveries/DeliveryQueuePage";

export const Route = createFileRoute("/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries — Sellora" },
      { name: "description", content: "Manage and track field deliveries." },
      { property: "og:title", content: "Deliveries — Sellora" },
    ],
  }),
  component: () => (
    <RouteGuard>
      <DeliveryQueuePage />
    </RouteGuard>
  ),
});
