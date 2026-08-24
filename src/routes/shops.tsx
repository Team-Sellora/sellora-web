import { createFileRoute } from "@tanstack/react-router";
import { EntityListPage } from "@/components/EntityListPage";
import { RouteGuard } from "@/auth/RouteGuard";

export const Route = createFileRoute("/shops")({
  head: () => ({
    meta: [
      { title: "Shops — Sellora" },
      { name: "description", content: "Manage retail outlets served by the distribution network." },
      { property: "og:title", content: "Shops — Sellora" },
      { property: "og:description", content: "Manage retail outlets served by the distribution network." },
    ],
  }),
  component: () => (
    <RouteGuard>
      <EntityListPage slug="shops" />
    </RouteGuard>
  ),
});
