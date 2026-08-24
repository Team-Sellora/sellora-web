import { createFileRoute } from "@tanstack/react-router";
import { EntityListPage } from "@/components/EntityListPage";
import { RouteGuard } from "@/auth/RouteGuard";

export const Route = createFileRoute("/territories")({
  head: () => ({
    meta: [
      { title: "Territories — Sellora" },
      { name: "description", content: "Manage sales territories and their shop coverage." },
      { property: "og:title", content: "Territories — Sellora" },
      { property: "og:description", content: "Manage sales territories and their shop coverage." },
    ],
  }),
  component: () => (
    <RouteGuard>
      <EntityListPage slug="territories" />
    </RouteGuard>
  ),
});
