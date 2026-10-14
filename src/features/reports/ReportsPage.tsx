import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ReportsApiError } from "./apiError";
import { BreakdownTabs } from "./components/BreakdownTabs";
import { DailySalesChart } from "./components/DailySalesChart";
import { ReportFilters } from "./components/ReportFilters";
import { StatusBreakdownChart } from "./components/StatusBreakdownChart";
import { SummaryCards } from "./components/SummaryCards";
import { computePreviousPeriod, getPresetRange } from "./dateRange";
import { useSalesBreakdown, useSalesSummary } from "./hooks";
import type { BreakdownGroupBy, ReportFilterState } from "./types";
import { ExportButtons } from "@/features/exports/components/ExportButtons";
import { MyExportsPanel } from "@/features/exports/components/MyExportsPanel";

export interface ReportsPageProps {
  initialTab?: BreakdownGroupBy | undefined;
}

export function ReportsPage({ initialTab = "rep" }: Readonly<ReportsPageProps>) {
  const initialRange = getPresetRange("this-month");
  const initialComparison = computePreviousPeriod(initialRange.from, initialRange.to);

  const [filters, setFilters] = useState<ReportFilterState>({
    preset: "this-month",
    from: initialRange.from,
    to: initialRange.to,
    compare: false,
    compareFrom: initialComparison.compareFrom,
    compareTo: initialComparison.compareTo,
  });

  const [activeTab, setActiveTab] = useState<BreakdownGroupBy>(initialTab);

  const summaryQuery = useSalesSummary({
    from: filters.from,
    to: filters.to,
    compareFrom: filters.compare ? filters.compareFrom : undefined,
    compareTo: filters.compare ? filters.compareTo : undefined,
  });

  const breakdownQuery = useSalesBreakdown({
    groupBy: activeTab,
    from: filters.from,
    to: filters.to,
  });

  const handleReset = () => {
    const range = getPresetRange("this-month");
    const comparison = computePreviousPeriod(range.from, range.to);
    setFilters({
      preset: "this-month",
      from: range.from,
      to: range.to,
      compare: false,
      compareFrom: comparison.compareFrom,
      compareTo: comparison.compareTo,
    });
  };

  const is503Error =
    (summaryQuery.error instanceof ReportsApiError && summaryQuery.error.status === 503) ||
    (breakdownQuery.error instanceof ReportsApiError && breakdownQuery.error.status === 503);

  const isSummaryEmpty =
    !summaryQuery.isLoading &&
    !summaryQuery.isError &&
    summaryQuery.data?.totals.orderCount === 0 &&
    summaryQuery.data?.totals.salesValue === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporting dashboard"
        description="Aggregate sales performance by rep, territory, agency and product."
        crumbs={[{ label: "Reports" }]}
        actions={
          <ExportButtons
            reportType="sales-breakdown"
            reportFilters={{
              from: filters.from,
              to: filters.to,
              compare: filters.compare,
              compareFrom: filters.compareFrom,
              compareTo: filters.compareTo,
              groupBy: activeTab,
            }}
            disabled={!filters.from || !filters.to || filters.from > filters.to}
          />
        }
      />

      <MyExportsPanel />

      <ReportFilters filters={filters} onChange={setFilters} onReset={handleReset} />

      {is503Error && (
        <div
          id="reports-503-notice"
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Organization service is unavailable, some area names may be missing</span>
        </div>
      )}

      {summaryQuery.isError && !is503Error && (
        <div
          id="reports-error-banner"
          role="alert"
          className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {summaryQuery.error instanceof ReportsApiError
                ? (summaryQuery.error.detail ?? summaryQuery.error.message)
                : "Failed to load reporting summary."}
            </span>
          </div>
          <Button
            id="reports-retry-button"
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void summaryQuery.refetch();
              void breakdownQuery.refetch();
            }}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {isSummaryEmpty ? (
        <div
          id="reports-empty-state"
          className="rounded-lg border border-dashed border-border p-12 text-center"
        >
          <h3 className="text-base font-semibold">No confirmed sales in this period</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your date range or selecting a different preset to view sales data.
          </p>
        </div>
      ) : (
        <>
          <SummaryCards
            totals={summaryQuery.data?.totals}
            comparison={filters.compare ? summaryQuery.data?.comparison : null}
            isLoading={summaryQuery.isLoading}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DailySalesChart
              daily={summaryQuery.data?.daily}
              hasComparison={filters.compare && !!summaryQuery.data?.comparison}
              isLoading={summaryQuery.isLoading}
            />

            <StatusBreakdownChart
              statusBreakdown={summaryQuery.data?.statusBreakdown}
              isLoading={summaryQuery.isLoading}
            />
          </div>

          <BreakdownTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            data={breakdownQuery.data}
            isLoading={breakdownQuery.isLoading}
          />
        </>
      )}
    </div>
  );
}
