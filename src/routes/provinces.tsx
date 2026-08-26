import { createFileRoute } from "@tanstack/react-router";
import { EntityListPage } from "@/components/EntityListPage";
import { RouteGuard } from "@/auth/RouteGuard";

export const Route = createFileRoute("/provinces")({
  head: () => ({
    meta: [
      { title: "Provinces — Sellora" },
      { name: "description", content: "Manage provinces in the Sellora distribution network." },
      { property: "og:title", content: "Provinces — Sellora" },
      {
        property: "og:description",
        content: "Manage provinces in the Sellora distribution network.",
      },
    ],
  }),
  component: () => (
    <RouteGuard>
      <EntityListPage slug="provinces" />
    </RouteGuard>
  ),
});
