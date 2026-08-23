import { createFileRoute } from "@tanstack/react-router";
import { EntityListPage } from "@/components/EntityListPage";

export const Route = createFileRoute("/provinces")({
  head: () => ({
    meta: [
      { title: "Provinces — Sellora" },
      { name: "description", content: "Manage provinces in the Sellora distribution network." },
      { property: "og:title", content: "Provinces — Sellora" },
      { property: "og:description", content: "Manage provinces in the Sellora distribution network." },
    ],
  }),
  component: () => <EntityListPage slug="provinces" />,
});
