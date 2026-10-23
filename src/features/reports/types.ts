export interface SalesTotals {
  salesValue: number;
  orderCount: number;
  averageOrderValue: number;
  expected: number;
  collected: number;
  outstanding: number;
}

export interface MetricDelta {
  absolute: number;
  percent: number | null;
}

export interface SalesDeltas {
  salesValue: MetricDelta;
  orderCount: MetricDelta;
  averageOrderValue: MetricDelta;
  collected: MetricDelta;
  expected?: MetricDelta | undefined;
  outstanding?: MetricDelta | undefined;
}

export interface SalesComparison {
  from: string;
  to: string;
  totals: SalesTotals;
  deltas: SalesDeltas;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
}

export interface DailySalesItem {
  date: string;
  salesValue: number;
  orderCount: number;
}

export interface SalesSummaryResponse {
  from: string;
  to: string;
  currency: string;
  totals: SalesTotals;
  statusBreakdown: StatusBreakdownItem[];
  daily: DailySalesItem[];
  comparison: SalesComparison | null;
}

export type BreakdownGroupBy = "rep" | "territory" | "agency" | "product";
export type BreakdownSortBy = "value" | "count" | "name";
export type SortDirection = "asc" | "desc";

export interface BreakdownRow {
  key: string;
  name: string;
  orderCount: number;
  salesValue: number;
  averageOrderValue: number;
}

export interface SalesBreakdownResponse {
  groupBy: BreakdownGroupBy;
  from: string;
  to: string;
  sort: BreakdownSortBy;
  direction: SortDirection;
  currency: string;
  rows: BreakdownRow[];
  totalOrderCount: number;
  totalSalesValue: number;
}

export interface SalesSummaryParams {
  from: string;
  to: string;
  compareFrom?: string | undefined;
  compareTo?: string | undefined;
}

export interface SalesBreakdownParams {
  groupBy: BreakdownGroupBy;
  from: string;
  to: string;
  sort?: BreakdownSortBy | undefined;
  direction?: SortDirection | undefined;
}

export type DatePresetKey = "this-month" | "last-month" | "last-90-days" | "custom";

export interface ReportFilterState {
  preset: DatePresetKey;
  from: string;
  to: string;
  compare: boolean;
  compareFrom: string;
  compareTo: string;
}
