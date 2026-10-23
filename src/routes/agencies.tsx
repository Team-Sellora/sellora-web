import { createFileRoute } from "@tanstack/react-router";
import { HierarchyPage } from "@/features/hierarchy/HierarchyPage";
import { RouteGuard } from "@/auth/RouteGuard";

export const Route = createFileRoute("/agencies")({
  head: () => ({
    meta: [
      { title: "Agencies — Sellora" },
      { name: "description", content: "Manage distribution agencies and their territories." },
      { property: "og:title", content: "Agencies — Sellora" },
      {
        property: "og:description",
        content: "Manage distribution agencies and their territories.",
      },
    ],
  }),
  component: () => (
    <RouteGuard>
      <HierarchyPage kind="agency" />
    </RouteGuard>
  ),
});
