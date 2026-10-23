import { createFileRoute } from "@tanstack/react-router";
import { HierarchyPage } from "@/features/hierarchy/HierarchyPage";
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
      <HierarchyPage kind="territory" />
    </RouteGuard>
  ),
});
