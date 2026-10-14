import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  Lock,
  ScrollText,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { useAuditSearch } from "./hooks";
import { AuditApiError } from "./apiError";
import type { AuditEntrySummary, AuditSearchFilter } from "./types";
import {
  canAccessAudit,
  formatAuditTimestamp,
  formatEventType,
  parseAuditSearchParams,
  shortenHash,
} from "./auditView";
import { AuditFilterForm } from "./components/AuditFilterForm";
import { AuditEntryDrawer } from "./components/AuditEntryDrawer";
import { AuditVerifyPanel } from "./components/AuditVerifyPanel";

export interface AuditPageProps {
  searchParams?: (AuditSearchFilter & { entry?: string | undefined }) | undefined;
}

export function AuditPage({ searchParams }: Readonly<AuditPageProps>) {
  const { role } = useSelloraAuth();
  const navigate = useNavigate();

  // Synchronize filter from searchParams or local fallback
  const initialFilter = searchParams ?? parseAuditSearchParams({});
  const [filter, setFilter] = useState<AuditSearchFilter>(initialFilter);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(searchParams?.entry ?? null);

  const { data, isLoading, isError, error } = useAuditSearch(filter);

  const entries = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const isTimeline = Boolean(filter.orderReference?.trim() || filter.aggregateId?.trim());

  const updateUrl = (updated: Partial<AuditSearchFilter & { entry?: string | undefined }>) => {
    if (!navigate) return;
    try {
      void navigate({
        to: "/audit",
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          ...updated,
        }),
      });
    } catch {
      // In tests without router provider
    }
  };

  const handleApplyFilter = (newFilter: AuditSearchFilter) => {
    const next = { ...newFilter, page: 1, pageSize: 20 };
    setFilter(next);
    updateUrl({ ...next, entry: activeEntryId ?? undefined });
  };

  const handleResetFilter = () => {
    const next: AuditSearchFilter = { page: 1, pageSize: 20 };
    setFilter(next);
    updateUrl({
      orderReference: undefined,
      eventType: undefined,
      aggregateType: undefined,
      aggregateId: undefined,
      actorUserId: undefined,
      from: undefined,
      to: undefined,
      page: 1,
      pageSize: 20,
    });
  };

  const handlePageChange = (newPage: number) => {
    const next = { ...filter, page: newPage };
    setFilter(next);
    updateUrl({ page: newPage });
  };

  const handleOpenEntry = (id: string) => {
    setActiveEntryId(id);
    updateUrl({ entry: id });
  };

  const handleCloseEntry = () => {
    setActiveEntryId(null);
    updateUrl({ entry: undefined });
  };

  const crumbs = [{ label: "Dashboard", to: "/" }, { label: "Audit log" }];

  if (!canAccessAudit(role)) {
    return (
      <div className="space-y-6" data-testid="audit-unauthorized">
        <PageHeader title="Audit log" crumbs={crumbs} />
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="size-5" />
            <span>Access Restricted</span>
          </div>
          <p className="mt-2 text-xs">
            Only Company Administrators and Area Managers are permitted to access the audit log.
          </p>
        </div>
      </div>
    );
  }

  const renderError = () => {
    if (!isError) return null;

    let message = "The audit entries could not be loaded. Please try again.";
    if (error instanceof AuditApiError) {
      if (error.status === 403) {
        message = "You do not have permission to view the audit log.";
      } else if (error.status === 503) {
        message = "The audit service is currently unavailable. Please try again later.";
      } else if (error.detail) {
        message = error.detail;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    return (
      <div
        role="alert"
        data-testid="audit-error-banner"
        className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
      >
        <AlertCircle className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">Unable to load audit entries</p>
          <p className="text-xs">{message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="audit-page">
      <PageHeader
        title="Audit log"
        description="Immutable cryptographic record of all business transactions and state changes."
        crumbs={crumbs}
      />

      <AuditVerifyPanel onSelectEntry={handleOpenEntry} />

      <AuditFilterForm
        initialFilter={filter}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

      {isTimeline && (
        <div
          data-testid="timeline-order-hint"
          className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary"
        >
          <History className="size-4 shrink-0" />
          <span>
            Timeline mode active: Entries for order or aggregate are ordered chronologically (oldest
            first).
          </span>
        </div>
      )}

      {renderError()}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Audit Entries</h3>
            {data && (
              <Badge variant="secondary" className="text-xs">
                {totalCount.toLocaleString()} total
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Times in Asia/Colombo (UTC+05:30)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="audit-table">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Pos</th>
                <th className="px-4 py-3 font-semibold">Event Type</th>
                <th className="px-4 py-3 font-semibold">Aggregate</th>
                <th className="px-4 py-3 font-semibold">Order Ref</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Recorded Time</th>
                <th className="px-4 py-3 font-semibold">Correlation</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Loading audit entries…
                  </td>
                </tr>
              )}

              {!isLoading && !isError && entries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No audit entries found matching the specified filters.
                  </td>
                </tr>
              )}

              {!isLoading &&
                entries.map((entry: AuditEntrySummary) => (
                  <tr
                    key={entry.auditEntryId}
                    onClick={() => handleOpenEntry(entry.auditEntryId)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    data-testid={`audit-row-${entry.chainPosition}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-muted-foreground">
                      #{entry.chainPosition}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{formatEventType(entry.eventType)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium">{entry.aggregateType}</span>
                      {entry.aggregateId && (
                        <span
                          className="ml-1 font-mono text-muted-foreground"
                          title={entry.aggregateId}
                        >
                          ({shortenHash(entry.aggregateId, 4, 4)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                      {entry.orderReference || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      <span title={entry.actorUserId}>{shortenHash(entry.actorUserId, 4, 4)}</span>
                      {entry.actorRole && (
                        <span className="ml-1 text-muted-foreground font-sans text-[11px]">
                          ({entry.actorRole})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatAuditTimestamp(entry.recordedAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.correlationId ? (
                        <span title={entry.correlationId}>
                          {shortenHash(entry.correlationId, 4, 4)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEntry(entry.auditEntryId);
                        }}
                        className="h-7 text-xs font-medium"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <div>
              Showing{" "}
              <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-medium text-foreground">
                {Math.min(page * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-medium text-foreground">{totalCount}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </Button>
              <span className="px-2 font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="h-8 gap-1 text-xs"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </section>

      <div
        data-testid="audit-immutability-notice"
        className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground"
      >
        <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Entries in the audit log are immutable and append-only. They are permanently recorded and
          cannot be altered, edited, or deleted by any user or administrator.
        </p>
      </div>

      <AuditEntryDrawer
        auditEntryId={activeEntryId}
        isOpen={Boolean(activeEntryId)}
        onClose={handleCloseEntry}
      />
    </div>
  );
}
