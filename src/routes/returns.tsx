import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { ShopReturnsListPage } from "@/features/returns/ShopReturnsListPage";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Shop Returns — Sellora" },
      { name: "description", content: "Manage and track customer shop returns." },
      { property: "og:title", content: "Shop Returns — Sellora" },
    ],
  }),
  component: () => (
    <RouteGuard>
      <ShopReturnsListPage />
    </RouteGuard>
  ),
});
