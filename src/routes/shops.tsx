import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { ShopPage } from "@/features/hierarchy/ShopPage";

export const Route = createFileRoute("/shops")({
  component: () => (
    <RouteGuard>
      <ShopPage />
    </RouteGuard>
  ),
});
