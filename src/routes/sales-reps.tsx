import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { SalesRepAssignmentPage } from "@/features/hierarchy/SalesRepAssignmentPage";

export const Route = createFileRoute("/sales-reps")({
  head: () => ({
    meta: [
      { title: "Sales Reps — Sellora" },
      { name: "description", content: "Manage field sales representatives and their territories." },
      { property: "og:title", content: "Sales Reps — Sellora" },
      {
        property: "og:description",
        content: "Manage field sales representatives and their territories.",
      },
    ],
  }),
  component: () => (
    <RouteGuard>
      <SalesRepAssignmentPage />
    </RouteGuard>
  ),
});
