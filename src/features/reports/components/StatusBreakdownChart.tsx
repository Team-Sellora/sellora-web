import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFriendlyStatus, formatInteger } from "../format";
import type { StatusBreakdownItem } from "../types";

export interface StatusBreakdownChartProps {
  statusBreakdown: StatusBreakdownItem[] | null | undefined;
  isLoading?: boolean;
}

const chartConfig = {
  count: {
    label: "Order Count",
    color: "#0d9488",
  },
} satisfies ChartConfig;

export function StatusBreakdownChart({
  statusBreakdown,
  isLoading,
}: Readonly<StatusBreakdownChartProps>) {
  if (isLoading || !statusBreakdown) {
    return (
      <Card className="h-[360px] p-4">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[260px] w-full" />
      </Card>
    );
  }

  const chartData = statusBreakdown.map((item) => ({
    status: item.status,
    label: formatFriendlyStatus(item.status),
    count: item.count,
  }));

  const totalOrders = statusBreakdown.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card id="chart-status-breakdown" className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Orders by Status</CardTitle>
        <p className="text-xs text-muted-foreground">
          Order count by status across the period ({formatInteger(totalOrders)} total)
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                className="text-[11px]"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val: number) => String(val)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload as
                    { status: string; label: string; count: number } | undefined;
                  if (!data) return null;
                  return (
                    <div className="rounded-md border bg-popover p-2 text-xs shadow-md">
                      <p className="font-semibold">{data.label}</p>
                      <p className="text-teal-600 font-medium dark:text-teal-400">
                        Orders: {formatInteger(data.count)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
