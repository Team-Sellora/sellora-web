import { createFileRoute } from "@tanstack/react-router";
import { EntityListPage } from "@/components/EntityListPage";
import { RouteGuard } from "@/auth/RouteGuard";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Sellora" },
      { name: "description", content: "Track stock on hand and reserved quantities per warehouse." },
      { property: "og:title", content: "Inventory — Sellora" },
      { property: "og:description", content: "Track stock on hand and reserved quantities per warehouse." },
    ],
  }),
  component: () => (
    <RouteGuard>
      <EntityListPage slug="inventory" />
    </RouteGuard>
  ),
});
