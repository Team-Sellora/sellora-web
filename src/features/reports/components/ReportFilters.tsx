import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { computePreviousPeriod, getPresetRange, validateDateRange } from "../dateRange";
import type { DatePresetKey, ReportFilterState } from "../types";

export interface ReportFiltersProps {
  filters: ReportFilterState;
  onChange: (filters: ReportFilterState) => void;
  onReset: () => void;
}

export function ReportFilters({ filters, onChange, onReset }: Readonly<ReportFiltersProps>) {
  const dateError = validateDateRange(filters.from, filters.to);
  const compareError = filters.compare
    ? validateDateRange(filters.compareFrom, filters.compareTo)
    : null;

  const handlePresetClick = (preset: DatePresetKey) => {
    const range = getPresetRange(preset);
    const comparison = computePreviousPeriod(range.from, range.to);
    onChange({
      ...filters,
      preset,
      from: range.from,
      to: range.to,
      compareFrom: comparison.compareFrom,
      compareTo: comparison.compareTo,
    });
  };

  const handleFromChange = (newFrom: string) => {
    const next: ReportFilterState = {
      ...filters,
      preset: "custom",
      from: newFrom,
    };
    if (filters.compare && newFrom <= filters.to) {
      const comparison = computePreviousPeriod(newFrom, filters.to);
      next.compareFrom = comparison.compareFrom;
      next.compareTo = comparison.compareTo;
    }
    onChange(next);
  };

  const handleToChange = (newTo: string) => {
    const next: ReportFilterState = {
      ...filters,
      preset: "custom",
      to: newTo,
    };
    if (filters.compare && filters.from <= newTo) {
      const comparison = computePreviousPeriod(filters.from, newTo);
      next.compareFrom = comparison.compareFrom;
      next.compareTo = comparison.compareTo;
    }
    onChange(next);
  };

  const handleToggleCompare = (checked: boolean) => {
    if (checked) {
      const comparison = computePreviousPeriod(filters.from, filters.to);
      onChange({
        ...filters,
        compare: true,
        compareFrom: comparison.compareFrom,
        compareTo: comparison.compareTo,
      });
    } else {
      onChange({
        ...filters,
        compare: false,
      });
    }
  };

  const handleCompareFromChange = (val: string) => {
    onChange({
      ...filters,
      compareFrom: val,
    });
  };

  const handleCompareToChange = (val: string) => {
    onChange({
      ...filters,
      compareTo: val,
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Preset:</span>
          <Button
            id="preset-this-month"
            type="button"
            size="sm"
            variant={filters.preset === "this-month" ? "default" : "outline"}
            onClick={() => handlePresetClick("this-month")}
            className="h-8 text-xs"
          >
            This month
          </Button>
          <Button
            id="preset-last-month"
            type="button"
            size="sm"
            variant={filters.preset === "last-month" ? "default" : "outline"}
            onClick={() => handlePresetClick("last-month")}
            className="h-8 text-xs"
          >
            Last month
          </Button>
          <Button
            id="preset-last-90-days"
            type="button"
            size="sm"
            variant={filters.preset === "last-90-days" ? "default" : "outline"}
            onClick={() => handlePresetClick("last-90-days")}
            className="h-8 text-xs"
          >
            Last 90 days
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            id="report-filter-reset"
            type="button"
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="h-8 gap-1 text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="report-filter-from"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            From date
          </label>
          <Input
            id="report-filter-from"
            type="date"
            value={filters.from}
            onChange={(e) => handleFromChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div>
          <label
            htmlFor="report-filter-to"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            To date
          </label>
          <Input
            id="report-filter-to"
            type="date"
            value={filters.to}
            onChange={(e) => handleToChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-2">
          <div className="flex h-8 items-center gap-2">
            <Switch
              id="report-filter-compare-toggle"
              checked={filters.compare}
              onCheckedChange={handleToggleCompare}
            />
            <label
              htmlFor="report-filter-compare-toggle"
              className="text-xs font-medium cursor-pointer"
            >
              Compare previous period
            </label>
          </div>
        </div>
      </div>

      {filters.compare && (
        <div className="mt-3 grid grid-cols-1 gap-4 rounded-md border border-dashed border-border/80 bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="report-filter-compare-from"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Comparison from date
            </label>
            <Input
              id="report-filter-compare-from"
              type="date"
              value={filters.compareFrom}
              onChange={(e) => handleCompareFromChange(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label
              htmlFor="report-filter-compare-to"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Comparison to date
            </label>
            <Input
              id="report-filter-compare-to"
              type="date"
              value={filters.compareTo}
              onChange={(e) => handleCompareToChange(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}

      {dateError && (
        <p
          id="report-filter-date-error"
          role="alert"
          className="mt-2 text-xs font-medium text-destructive"
        >
          {dateError}
        </p>
      )}

      {compareError && (
        <p
          id="report-filter-compare-error"
          role="alert"
          className="mt-2 text-xs font-medium text-destructive"
        >
          Comparison period: {compareError}
        </p>
      )}
    </div>
  );
}
