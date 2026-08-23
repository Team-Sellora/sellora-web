import { createFileRoute } from "@tanstack/react-router";
import { EntityListPage } from "@/components/EntityListPage";

export const Route = createFileRoute("/agencies")({
  head: () => ({
    meta: [
      { title: "Agencies — Sellora" },
      { name: "description", content: "Manage distribution agencies and their territories." },
      { property: "og:title", content: "Agencies — Sellora" },
      { property: "og:description", content: "Manage distribution agencies and their territories." },
    ],
  }),
  component: () => <EntityListPage slug="agencies" />,
});
