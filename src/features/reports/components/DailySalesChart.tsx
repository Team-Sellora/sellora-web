import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInteger, formatLkr } from "../format";
import type { DailySalesItem } from "../types";

export interface DailySalesChartProps {
  daily: DailySalesItem[] | null | undefined;
  comparisonDaily?: DailySalesItem[] | null | undefined;
  hasComparison?: boolean;
  isLoading?: boolean;
}

const chartConfig = {
  salesValue: {
    label: "Sales (LKR)",
    color: "#2563eb",
  },
  comparisonSalesValue: {
    label: "Previous period (LKR)",
    color: "#94a3b8",
  },
} satisfies ChartConfig;

export function DailySalesChart({
  daily,
  comparisonDaily,
  hasComparison,
  isLoading,
}: Readonly<DailySalesChartProps>) {
  const [showTable, setShowTable] = useState(false);

  if (isLoading || !daily) {
    return (
      <Card className="h-[360px] p-4">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[260px] w-full" />
      </Card>
    );
  }

  // Merge daily data with comparison if available
  const chartData = daily.map((item, index) => {
    const compItem = comparisonDaily?.[index];
    return {
      date: item.date,
      salesValue: item.salesValue,
      orderCount: item.orderCount,
      comparisonSalesValue: compItem ? compItem.salesValue : undefined,
    };
  });

  const totalSales = daily.reduce((acc, curr) => acc + curr.salesValue, 0);
  const totalOrders = daily.reduce((acc, curr) => acc + curr.orderCount, 0);

  return (
    <Card id="chart-daily-sales" className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Daily Sales Trend</CardTitle>
          <p className="text-xs text-muted-foreground">
            Confirmed sales by day ({daily.length} days, {formatInteger(totalOrders)} orders,{" "}
            {formatLkr(totalSales)})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          className="text-xs font-medium text-primary hover:underline focus:outline-hidden"
          aria-expanded={showTable}
          aria-controls="daily-sales-text-table"
        >
          {showTable ? "Hide data table" : "View data table"}
        </button>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val: string) => {
                  const parts = val.split("-");
                  return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : val;
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val: number) =>
                  val >= 1_000_000
                    ? `${(val / 1_000_000).toFixed(1)}M`
                    : val >= 1_000
                      ? `${(val / 1_000).toFixed(0)}k`
                      : String(val)
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload as
                    | {
                        date: string;
                        salesValue: number;
                        orderCount: number;
                        comparisonSalesValue?: number | undefined;
                      }
                    | undefined;
                  if (!data) return null;
                  return (
                    <div className="rounded-md border bg-popover p-2 text-xs shadow-md">
                      <p className="font-semibold">{data.date}</p>
                      <p className="text-primary font-medium">
                        Sales: {formatLkr(data.salesValue)} ({data.orderCount} orders)
                      </p>
                      {hasComparison && data.comparisonSalesValue !== undefined && (
                        <p className="text-muted-foreground">
                          Previous: {formatLkr(data.comparisonSalesValue)}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="salesValue"
                stroke="var(--color-salesValue)"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
              {hasComparison && (
                <Line
                  type="monotone"
                  dataKey="comparisonSalesValue"
                  stroke="var(--color-comparisonSalesValue)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Text alternative for screen readers and accessibility */}
        <div
          id="daily-sales-text-table"
          className={showTable ? "mt-4 max-h-48 overflow-y-auto rounded border p-2" : "sr-only"}
          aria-label="Daily sales data table"
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b">
                <th className="py-1">Date</th>
                <th className="py-1 text-right">Orders</th>
                <th className="py-1 text-right">Sales</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((row) => (
                <tr key={row.date} className="border-b border-muted">
                  <td className="py-1 font-mono">{row.date}</td>
                  <td className="py-1 text-right">{formatInteger(row.orderCount)}</td>
                  <td className="py-1 text-right">{formatLkr(row.salesValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
