import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { ProductDetailsPage } from "@/features/products/ProductDetailsPage";

export const Route = createFileRoute("/products_/$productId")({
  head: () => ({
    meta: [
      {
        title: "Product Details — Sellora",
      },
      {
        name: "description",
        content: "View product, pricing, and batch information.",
      },
    ],
  }),

  component: ProductDetailsRoute,
});

function ProductDetailsRoute() {
  const { productId } = Route.useParams();

  return (
    <RouteGuard>
      <ProductDetailsPage productId={productId} />
    </RouteGuard>
  );
}
