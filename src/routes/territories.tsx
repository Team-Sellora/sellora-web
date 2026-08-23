import { createFileRoute } from "@tanstack/react-router";
import { EntityListPage } from "@/components/EntityListPage";

export const Route = createFileRoute("/territories")({
  head: () => ({
    meta: [
      { title: "Territories — Sellora" },
      { name: "description", content: "Manage sales territories and their shop coverage." },
      { property: "og:title", content: "Territories — Sellora" },
      { property: "og:description", content: "Manage sales territories and their shop coverage." },
    ],
  }),
  component: () => <EntityListPage slug="territories" />,
});
