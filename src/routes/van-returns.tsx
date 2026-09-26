import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { VanReturnListPage } from "@/features/van-returns/VanReturnListPage";

export const Route = createFileRoute("/van-returns")({
  head: () => ({
    meta: [
      { title: "Van returns — Sellora" },
      {
        name: "description",
        content: "Unsold van stock returned to the agency at the end of a route.",
      },
    ],
  }),
  component: () => (
    <RouteGuard>
      <VanReturnListPage />
    </RouteGuard>
  ),
});
