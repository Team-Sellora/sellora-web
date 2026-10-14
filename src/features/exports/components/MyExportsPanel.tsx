import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportApiError } from "../apiError";
import { downloadExportFile } from "../download";
import type { ExportStatusResponse } from "../types";
import { MY_EXPORTS_QUERY_KEY, useMyExports } from "../useMyExports";

export function formatColomboTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return iso;
  }
}

export function isExportExpired(item: ExportStatusResponse): boolean {
  if (item.status === "Expired") return true;
  if (!item.expiresAt) return false;
  return new Date(item.expiresAt).getTime() <= Date.now();
}

export function getReportTypeLabel(type: string): string {
  switch (type) {
    case "sales-summary":
      return "Sales summary";
    case "sales-breakdown":
      return "Sales breakdown";
    case "audit-extract":
      return "Audit extract";
    default:
      return type;
  }
}

export function MyExportsPanel() {
  const { role } = useSelloraAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useMyExports();

  if (role !== "CompanyAdmin" && role !== "AreaManager") {
    return null;
  }

  const exportsList = data ?? [];

  const handleDownload = async (item: ExportStatusResponse) => {
    if (downloadingId) return;
    setDownloadingId(item.exportId);

    try {
      await downloadExportFile(item.exportId, { fallbackFormat: item.format });
      toast.success("Export downloaded.");
    } catch (err) {
      if (err instanceof ExportApiError && err.status === 410) {
        toast.error("This export has expired");
        void queryClient.invalidateQueries({ queryKey: MY_EXPORTS_QUERY_KEY });
      } else if (err instanceof ExportApiError && err.status === 404) {
        toast.error("Export not found");
        void queryClient.invalidateQueries({ queryKey: MY_EXPORTS_QUERY_KEY });
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to download export.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const renderStatusBadge = (item: ExportStatusResponse) => {
    const expired = isExportExpired(item);

    if (expired) {
      return (
        <Badge variant="secondary" className="gap-1 font-normal text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Expired</span>
        </Badge>
      );
    }

    switch (item.status) {
      case "Ready":
        return (
          <Badge className="gap-1 bg-emerald-600 font-normal text-white hover:bg-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>Ready</span>
          </Badge>
        );
      case "Running":
        return (
          <Badge className="gap-1 bg-amber-600 font-normal text-white hover:bg-amber-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Running</span>
          </Badge>
        );
      case "Queued":
        return (
          <Badge className="gap-1 bg-sky-600 font-normal text-white hover:bg-sky-600">
            <Clock className="h-3 w-3" />
            <span>Queued</span>
          </Badge>
        );
      case "Failed":
        return (
          <Badge variant="destructive" className="gap-1 font-normal">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{item.status}</Badge>;
    }
  };

  return (
    <div
      className="rounded-lg border bg-card text-card-foreground shadow-sm"
      data-testid="my-exports-panel"
    >
      <div className="flex items-center justify-between p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">My exports</h2>
          <Badge variant="secondary" className="text-xs">
            {exportsList.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className="h-8 gap-1 text-xs"
          >
            <span>{isOpen ? "Hide" : "Show"}</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t p-3 sm:p-4">
          {isLoading && (
            <div className="space-y-2" data-testid="my-exports-skeleton">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {isError && (
            <div
              role="alert"
              className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {error instanceof Error ? error.message : "Unable to load recent exports"}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                className="h-7 text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                <span>Retry</span>
              </Button>
            </div>
          )}

          {!isLoading && !isError && exportsList.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">No exports yet.</p>
          )}

          {!isLoading && !isError && exportsList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 font-medium">Report</th>
                    <th className="pb-2 font-medium">Format</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Created</th>
                    <th className="pb-2 font-medium">Expires</th>
                    <th className="pb-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {exportsList.map((item) => {
                    const expired = isExportExpired(item);
                    const isReady = item.status === "Ready" && !expired;
                    const isFailed = item.status === "Failed";

                    return (
                      <tr
                        key={item.exportId}
                        className={expired ? "text-muted-foreground opacity-60" : ""}
                      >
                        <td className="py-2.5 font-medium">
                          {getReportTypeLabel(item.reportType)}
                          {isFailed && item.error && (
                            <p className="text-[11px] text-destructive">{item.error}</p>
                          )}
                        </td>
                        <td className="py-2.5 uppercase">{item.format}</td>
                        <td className="py-2.5">{renderStatusBadge(item)}</td>
                        <td className="py-2.5 whitespace-nowrap">
                          {formatColomboTime(item.createdAt)}
                        </td>
                        <td className="py-2.5 whitespace-nowrap">
                          {expired ? "Expired" : formatColomboTime(item.expiresAt)}
                        </td>
                        <td className="py-2.5 text-right">
                          {isReady ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={downloadingId === item.exportId}
                              onClick={() => void handleDownload(item)}
                              className="h-7 gap-1 text-xs"
                              aria-label={`Download ${getReportTypeLabel(item.reportType)} file`}
                            >
                              {downloadingId === item.exportId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                              <span>Download</span>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
