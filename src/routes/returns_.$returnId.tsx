import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { ReturnDetailPage } from "@/features/returns/ReturnDetailPage";

export const Route = createFileRoute("/returns_/$returnId")({
  head: () => ({
    meta: [{ title: "Return Details — Sellora" }],
  }),
  component: () => (
    <RouteGuard>
      <ReturnDetailPage />
    </RouteGuard>
  ),
});
