import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { recentActivity, summaryStats } from "@/lib/mock-data";

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
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Snapshot of the field-sales and distribution network."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-5">
            <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-5 py-3 text-sm font-medium">Recent activity</h2>
        <ul>
          {recentActivity.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 border-b border-border px-5 py-3 text-sm last:border-0"
            >
              <span>{item.text}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
