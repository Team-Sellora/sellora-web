import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { Button } from "@/components/ui/button";
import { toColomboEndInstant, toColomboStartInstant } from "@/features/audit/api";
import type { AuditSearchFilter } from "@/features/audit/types";
import { useRunExport } from "../hooks";
import type { CreateExportRequest, ExportFilters, ExportFormat, ExportReportType } from "../types";

export interface ReportsExportFilters {
  from?: string | undefined;
  to?: string | undefined;
  compare?: boolean | undefined;
  compareFrom?: string | undefined;
  compareTo?: string | undefined;
  groupBy?: string | undefined;
  sort?: string | undefined;
  direction?: string | undefined;
}

export interface ExportButtonsProps {
  reportType?: ExportReportType | undefined;
  reportFilters?: ReportsExportFilters | undefined;
  auditFilters?: AuditSearchFilter | undefined;
  disabled?: boolean | undefined;
}

export function ExportButtons({
  reportType = "sales-breakdown",
  reportFilters,
  auditFilters,
  disabled = false,
}: Readonly<ExportButtonsProps>) {
  const { role } = useSelloraAuth();
  const { runExport, phase, isPending } = useRunExport();

  // Active sales export variant (summary or breakdown)
  const [salesReportType, setSalesReportType] = useState<"sales-summary" | "sales-breakdown">(
    reportType === "sales-summary" ? "sales-summary" : "sales-breakdown",
  );

  const isAudit = reportType === "audit-extract";

  // Audit export is restricted to CompanyAdmin only
  if (isAudit && role !== "CompanyAdmin") {
    return null;
  }

  // Reports export is available only to CompanyAdmin and AreaManager
  if (!isAudit && role !== "CompanyAdmin" && role !== "AreaManager") {
    return null;
  }

  const handleExport = (format: ExportFormat) => {
    if (disabled || isPending) return;

    if (isAudit) {
      const filters: ExportFilters = {
        aggregateType: auditFilters?.aggregateType?.trim() || undefined,
        aggregateId: auditFilters?.aggregateId?.trim() || undefined,
        orderReference: auditFilters?.orderReference?.trim() || undefined,
        actorUserId: auditFilters?.actorUserId?.trim() || undefined,
        eventType: auditFilters?.eventType?.trim() || undefined,
        occurredFrom: auditFilters?.from ? toColomboStartInstant(auditFilters.from) : undefined,
        occurredTo: auditFilters?.to ? toColomboEndInstant(auditFilters.to) : undefined,
      };

      const request: CreateExportRequest = {
        reportType: "audit-extract",
        format: "csv",
        filters,
      };

      void runExport(request);
      return;
    }

    const filters: ExportFilters =
      salesReportType === "sales-summary"
        ? {
            from: reportFilters?.from,
            to: reportFilters?.to,
            compareFrom: reportFilters?.compare ? reportFilters.compareFrom : undefined,
            compareTo: reportFilters?.compare ? reportFilters.compareTo : undefined,
          }
        : {
            from: reportFilters?.from,
            to: reportFilters?.to,
            groupBy: reportFilters?.groupBy ?? "rep",
            sort: reportFilters?.sort ?? "value",
            direction: reportFilters?.direction ?? "desc",
          };

    const request: CreateExportRequest = {
      reportType: salesReportType,
      format,
      filters,
    };

    void runExport(request);
  };

  const getStatusLabel = (format: ExportFormat): string => {
    if (phase === "Queued") return "Queued…";
    if (phase === "Running") return "Generating…";
    if (phase === "Downloading") return "Downloading…";
    return format === "csv" ? "Export CSV" : "Export PDF";
  };

  return (
    <div className="flex flex-wrap items-center gap-2" role="region" aria-label="Report export">
      <div className="sr-only" aria-live="polite">
        {phase === "idle" ? "" : `Export status: ${phase}`}
      </div>

      {!isAudit && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="sr-only">Report mode</span>
          <select
            value={salesReportType}
            onChange={(e) =>
              setSalesReportType(e.target.value as "sales-summary" | "sales-breakdown")
            }
            disabled={disabled || isPending}
            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            aria-label="Select report content to export"
          >
            <option value="sales-breakdown">Breakdown</option>
            <option value="sales-summary">Summary</option>
          </select>
        </label>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isPending}
        onClick={() => handleExport("csv")}
        aria-label="Export report as CSV"
        className="h-8 gap-1.5 text-xs"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3.5 w-3.5" />
        )}
        <span>{getStatusLabel("csv")}</span>
      </Button>

      {!isAudit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isPending}
          onClick={() => handleExport("pdf")}
          aria-label="Export report as PDF"
          className="h-8 gap-1.5 text-xs"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          <span>{getStatusLabel("pdf")}</span>
        </Button>
      )}
    </div>
  );
}
