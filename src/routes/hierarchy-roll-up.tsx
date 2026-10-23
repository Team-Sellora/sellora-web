import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { HierarchyRollUpPage } from "@/features/hierarchy/HierarchyRollUpPage";

export const Route = createFileRoute("/hierarchy-roll-up")({
  head: () => ({
    meta: [
      { title: "Hierarchy roll-up — Sellora" },
      {
        name: "description",
        content: "Company-wide hierarchy counts, coverage gaps, and reporting lines.",
      },
    ],
  }),
  component: () => (
    <RouteGuard>
      <HierarchyRollUpPage />
    </RouteGuard>
  ),
});
