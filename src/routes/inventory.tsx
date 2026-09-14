import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { InventoryPage } from "@/features/inventory/InventoryPage";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Sellora" },
      {
        name: "description",
        content: "View role-scoped stock levels and record authorised adjustments.",
      },
      { property: "og:title", content: "Inventory — Sellora" },
      {
        property: "og:description",
        content: "View role-scoped stock levels and record authorised adjustments.",
      },
    ],
  }),
  component: () => (
    <RouteGuard>
      <InventoryPage />
    </RouteGuard>
  ),
});
