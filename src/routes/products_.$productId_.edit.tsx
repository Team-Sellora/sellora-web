import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { EditProductPage } from "@/features/products/EditProductPage";

export const Route = createFileRoute("/products_/$productId_/edit")({
  head: () => ({
    meta: [
      {
        title: "Edit Product — Sellora",
      },
      {
        name: "description",
        content: "Update product information in the company catalogue.",
      },
    ],
  }),

  component: EditProductRoute,
});

function EditProductRoute() {
  const { productId } = Route.useParams();

  return (
    <RouteGuard>
      <EditProductPage productId={productId} />
    </RouteGuard>
  );
}
