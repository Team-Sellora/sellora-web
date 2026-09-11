import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { CategoryPage } from "@/features/products/CategoryPage";
export const Route = createFileRoute("/product-categories")({
  component: () => (
    <RouteGuard>
      <CategoryPage />
    </RouteGuard>
  ),
});
