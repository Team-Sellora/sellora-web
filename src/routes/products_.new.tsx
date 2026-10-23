import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { CreateProductPage } from "@/features/products/CreateProductPage";

export const Route = createFileRoute("/products_/new")({
  head: () => ({
    meta: [
      {
        title: "New Product — Sellora",
      },
      {
        name: "description",
        content: "Register a new product in the company catalogue.",
      },
    ],
  }),

  component: () => (
    <RouteGuard>
      <CreateProductPage />
    </RouteGuard>
  ),
});
