import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { CreateOrderPage } from "@/features/orders/CreateOrderPage";

export const Route = createFileRoute("/orders_/new")({
  head: () => ({
    meta: [
      { title: "New Order — Sellora" },
      { name: "description", content: "Record a shop's order as a sales rep." },
    ],
  }),
  component: () => (
    <RouteGuard>
      <CreateOrderPage />
    </RouteGuard>
  ),
});
