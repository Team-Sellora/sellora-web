import { createFileRoute } from "@tanstack/react-router";
import { ProductPage } from "@/features/products/ProductPage";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Sellora" },
      { name: "description", content: "Manage the FMCG product catalogue and pricing." },
      { property: "og:title", content: "Products — Sellora" },
      { property: "og:description", content: "Manage the FMCG product catalogue and pricing." },
    ],
  }),
  component: ProductPage,
});
