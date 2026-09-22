import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { OrderListPage } from "@/features/orders/OrderListPage";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Sellora" },
      { name: "description", content: "Review field sales orders placed by representatives." },
      { property: "og:title", content: "Orders — Sellora" },
      {
        property: "og:description",
        content: "Review field sales orders placed by representatives.",
      },
    ],
  }),
  component: () => (
    <RouteGuard>
      <OrderListPage />
    </RouteGuard>
  ),
});
