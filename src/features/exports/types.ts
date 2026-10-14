export type ExportReportType = "sales-summary" | "sales-breakdown" | "audit-extract";

export type ExportFormat = "csv" | "pdf";

export type ExportStatus = "Queued" | "Running" | "Ready" | "Failed" | "Expired";

export interface ExportFilters {
  from?: string | undefined;
  to?: string | undefined;
  compareFrom?: string | undefined;
  compareTo?: string | undefined;
  groupBy?: string | undefined;
  sort?: string | undefined;
  direction?: string | undefined;
  aggregateType?: string | undefined;
  aggregateId?: string | undefined;
  orderReference?: string | undefined;
  actorUserId?: string | undefined;
  eventType?: string | undefined;
  occurredFrom?: string | undefined;
  occurredTo?: string | undefined;
}

export interface CreateExportRequest {
  reportType: ExportReportType;
  format: ExportFormat;
  filters?: ExportFilters | undefined;
}

export interface ExportAccepted {
  exportId: string;
}

export interface ExportStatusResponse {
  exportId: string;
  reportType: ExportReportType;
  format: ExportFormat;
  status: ExportStatus;
  createdAt: string;
  startedAt?: string | null | undefined;
  completedAt?: string | null | undefined;
  expiresAt?: string | null | undefined;
  fileName?: string | null | undefined;
  downloadPath?: string | null | undefined;
  error?: string | null | undefined;
}
