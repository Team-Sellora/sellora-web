import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAov, formatInteger, formatLkr } from "../format";
import { sortRows, type BreakdownSortColumn } from "../sortRows";
import type { BreakdownGroupBy, SalesBreakdownResponse, SortDirection } from "../types";

export interface BreakdownTabsProps {
  activeTab: BreakdownGroupBy;
  onTabChange: (tab: BreakdownGroupBy) => void;
  data: SalesBreakdownResponse | null | undefined;
  isLoading?: boolean;
}

export function BreakdownTabs({
  activeTab,
  onTabChange,
  data,
  isLoading,
}: Readonly<BreakdownTabsProps>) {
  const [sortColumn, setSortColumn] = useState<BreakdownSortColumn>("salesValue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleHeaderClick = (col: BreakdownSortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection(col === "name" ? "asc" : "desc");
    }
  };

  const getAriaSort = (col: BreakdownSortColumn): "ascending" | "descending" | "none" => {
    if (sortColumn !== col) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  const rows = data?.rows ? sortRows(data.rows, sortColumn, sortDirection) : [];

  const tabLabels: Record<BreakdownGroupBy, string> = {
    rep: "Sales Rep",
    territory: "Territory",
    agency: "Agency",
    product: "Product",
  };

  return (
    <div
      id="section-breakdown"
      className="rounded-lg border bg-card p-4 text-card-foreground shadow-xs"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Sales Breakdown</h2>
          <p className="text-xs text-muted-foreground">
            Performance comparison grouped by {tabLabels[activeTab].toLowerCase()}
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => onTabChange(val as BreakdownGroupBy)}
          className="w-auto"
        >
          <TabsList className="grid grid-cols-4 h-8 text-xs">
            <TabsTrigger
              id="tab-rep"
              value="rep"
              onClick={() => onTabChange("rep")}
              className="text-xs"
            >
              Rep
            </TabsTrigger>
            <TabsTrigger
              id="tab-territory"
              value="territory"
              onClick={() => onTabChange("territory")}
              className="text-xs"
            >
              Territory
            </TabsTrigger>
            <TabsTrigger
              id="tab-agency"
              value="agency"
              onClick={() => onTabChange("agency")}
              className="text-xs"
            >
              Agency
            </TabsTrigger>
            <TabsTrigger
              id="tab-product"
              value="product"
              onClick={() => onTabChange("product")}
              className="text-xs"
            >
              Product
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label={`Sales breakdown by ${activeTab}`}>
          <thead>
            <tr className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
              <th
                scope="col"
                aria-sort={getAriaSort("name")}
                onClick={() => handleHeaderClick("name")}
                className="cursor-pointer px-4 py-2 hover:bg-muted/60"
              >
                <div className="flex items-center gap-1">
                  <span>{tabLabels[activeTab]}</span>
                  {sortColumn === "name" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={getAriaSort("orderCount")}
                onClick={() => handleHeaderClick("orderCount")}
                className="cursor-pointer px-4 py-2 text-right hover:bg-muted/60"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Orders</span>
                  {sortColumn === "orderCount" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={getAriaSort("salesValue")}
                onClick={() => handleHeaderClick("salesValue")}
                className="cursor-pointer px-4 py-2 text-right hover:bg-muted/60"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Sales Value</span>
                  {sortColumn === "salesValue" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                scope="col"
                aria-sort={getAriaSort("averageOrderValue")}
                onClick={() => handleHeaderClick("averageOrderValue")}
                className="cursor-pointer px-4 py-2 text-right hover:bg-muted/60"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Average Order Value</span>
                  {sortColumn === "averageOrderValue" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  id="breakdown-empty-state"
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No confirmed sales for this breakdown
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key} className="border-b hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">{row.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">
                    {formatInteger(row.orderCount)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">
                    {formatLkr(row.salesValue)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                    {formatAov(row.averageOrderValue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {!isLoading && rows.length > 0 && data && (
            <tfoot>
              <tr className="border-t bg-muted/30 font-semibold text-xs">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right font-mono">
                  {formatInteger(data.totalOrderCount)}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {formatLkr(data.totalSalesValue)}
                </td>
                <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                  {data.totalOrderCount > 0
                    ? formatAov(data.totalSalesValue / data.totalOrderCount)
                    : "—"}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
