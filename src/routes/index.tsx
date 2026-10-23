import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sellora Management Console" },
      {
        name: "description",
        content:
          "Overview of agencies, territories, shops and active field reps across the Sellora distribution network.",
      },
      { property: "og:title", content: "Dashboard — Sellora Management Console" },
      {
        property: "og:description",
        content: "Overview of agencies, territories, shops and active field reps.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return <DashboardPage />;
}
