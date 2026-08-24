import { createFileRoute } from "@tanstack/react-router";
import { EntityListPage } from "@/components/EntityListPage";
import { RouteGuard } from "@/auth/RouteGuard";

export const Route = createFileRoute("/area-managers")({
  head: () => ({
    meta: [
      { title: "Area Managers — Sellora" },
      { name: "description", content: "Manage area managers and their assigned provinces." },
      { property: "og:title", content: "Area Managers — Sellora" },
      { property: "og:description", content: "Manage area managers and their assigned provinces." },
    ],
  }),
  component: () => (
    <RouteGuard>
      <EntityListPage slug="area-managers" />
    </RouteGuard>
  ),
});
