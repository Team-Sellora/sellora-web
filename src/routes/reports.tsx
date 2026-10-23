import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { ReportsPage } from "@/features/reports/ReportsPage";
import type { BreakdownGroupBy } from "@/features/reports/types";

interface ReportsSearch {
  tab?: BreakdownGroupBy | undefined;
}

export const Route = createFileRoute("/reports")({
  validateSearch: (search: Record<string, unknown>): ReportsSearch => {
    const rawTab = search["tab"];
    const validTabs: BreakdownGroupBy[] = ["rep", "territory", "agency", "product"];
    const tab =
      typeof rawTab === "string" && validTabs.includes(rawTab as BreakdownGroupBy)
        ? (rawTab as BreakdownGroupBy)
        : undefined;
    return { tab };
  },
  head: () => ({
    meta: [
      { title: "Reports — Sellora" },
      {
        name: "description",
        content: "Reporting dashboard of sales performance by rep, territory, agency and product.",
      },
      { property: "og:title", content: "Reports — Sellora" },
      {
        property: "og:description",
        content: "Reporting dashboard of sales performance by rep, territory, agency and product.",
      },
    ],
  }),
  component: ReportsRouteComponent,
});

function ReportsRouteComponent() {
  const search = Route.useSearch();
  return (
    <RouteGuard>
      <ReportsPage initialTab={search.tab} />
    </RouteGuard>
  );
}
