import { createFileRoute } from "@tanstack/react-router";
import { EntityListPage } from "@/components/EntityListPage";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Sellora" },
      { name: "description", content: "Manage the FMCG product catalogue and pricing." },
      { property: "og:title", content: "Products — Sellora" },
      { property: "og:description", content: "Manage the FMCG product catalogue and pricing." },
    ],
  }),
  component: () => <EntityListPage slug="products" />,
});
