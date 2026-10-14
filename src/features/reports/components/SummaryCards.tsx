import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDeltaAbsolute, formatDeltaPercent, getDeltaDirection } from "../delta";
import { formatAov, formatInteger, formatLkr } from "../format";
import type { MetricDelta, SalesComparison, SalesTotals } from "../types";

interface DeltaBadgeProps {
  metricKey: string;
  delta: MetricDelta | null | undefined;
  formatType?: "currency" | "aov" | "count";
}

function DeltaBadge({ metricKey, delta, formatType = "currency" }: Readonly<DeltaBadgeProps>) {
  if (!delta) return null;

  const direction = getDeltaDirection(metricKey, delta.absolute);
  const colorClass =
    direction === "good"
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
      : direction === "bad"
        ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
        : "text-muted-foreground bg-muted";

  const directionText = delta.absolute > 0 ? "Up" : delta.absolute < 0 ? "Down" : "No change";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${colorClass}`}
      aria-label={`${directionText} ${formatDeltaAbsolute(delta.absolute, formatType)} (${formatDeltaPercent(delta.percent)}) vs previous period`}
    >
      {delta.absolute > 0 && <ArrowUp className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {delta.absolute < 0 && <ArrowDown className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {delta.absolute === 0 && <Minus className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span>
        {formatDeltaAbsolute(delta.absolute, formatType)} ({formatDeltaPercent(delta.percent)})
      </span>
    </div>
  );
}

export interface SummaryCardsProps {
  totals: SalesTotals | null | undefined;
  comparison: SalesComparison | null | undefined;
  isLoading?: boolean;
}

export function SummaryCards({ totals, comparison, isLoading }: Readonly<SummaryCardsProps>) {
  if (isLoading || !totals) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-36 mb-2" />
            <Skeleton className="h-4 w-28" />
          </Card>
        ))}
      </div>
    );
  }

  const outstandingDelta: MetricDelta | null = comparison
    ? (comparison.deltas.outstanding ?? {
        absolute: totals.outstanding - comparison.totals.outstanding,
        percent:
          comparison.totals.outstanding === 0
            ? null
            : ((totals.outstanding - comparison.totals.outstanding) /
                comparison.totals.outstanding) *
              100,
      })
    : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Sales Value */}
      <Card id="card-total-sales">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Total Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{formatLkr(totals.salesValue)}</div>
          {comparison && (
            <div className="mt-2">
              <DeltaBadge
                metricKey="salesValue"
                delta={comparison.deltas.salesValue}
                formatType="currency"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Count */}
      <Card id="card-total-orders">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Total Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {formatInteger(totals.orderCount)}
          </div>
          {comparison && (
            <div className="mt-2">
              <DeltaBadge
                metricKey="orderCount"
                delta={comparison.deltas.orderCount}
                formatType="count"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Average Order Value */}
      <Card id="card-average-order-value">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Average Order Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">
            {formatAov(totals.averageOrderValue)}
          </div>
          {comparison && (
            <div className="mt-2">
              <DeltaBadge
                metricKey="averageOrderValue"
                delta={comparison.deltas.averageOrderValue}
                formatType="aov"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collections & Expected */}
      <Card id="card-collections-expected">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Collected vs Expected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatLkr(totals.collected)}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              / {formatLkr(totals.expected)} exp.
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Outstanding:{" "}
            <span className="font-semibold text-foreground">{formatLkr(totals.outstanding)}</span>
          </div>
          {comparison && (
            <div className="mt-2 flex flex-wrap gap-2">
              <DeltaBadge
                metricKey="collected"
                delta={comparison.deltas.collected}
                formatType="currency"
              />
              {outstandingDelta && (
                <DeltaBadge
                  metricKey="outstanding"
                  delta={outstandingDelta}
                  formatType="currency"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
