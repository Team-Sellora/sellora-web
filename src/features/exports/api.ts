import { auditApiFetch } from "@/api/client";
import { ExportApiError } from "./apiError";
import type { CreateExportRequest, ExportAccepted, ExportStatusResponse } from "./types";

async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let detail: string | undefined;
  let title: string | undefined;
  try {
    const body = (await response.json()) as { detail?: string; title?: string; message?: string };
    detail = body.detail ?? body.message;
    title = body.title;
  } catch {
    // Non-JSON response body
  }

  if (response.status === 503 && !detail) {
    detail = "Organization service is unavailable, try again later";
  }

  throw new ExportApiError(response.status, detail, title);
}

export function submitExport(request: CreateExportRequest): Promise<ExportAccepted> {
  return auditApiFetch("/api/reports/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }).then(unwrap<ExportAccepted>);
}

export function getExportStatus(exportId: string): Promise<ExportStatusResponse> {
  return auditApiFetch(`/api/reports/export/${encodeURIComponent(exportId)}`).then(
    unwrap<ExportStatusResponse>,
  );
}

export function listMyExports(): Promise<ExportStatusResponse[]> {
  return auditApiFetch("/api/reports/export").then(unwrap<ExportStatusResponse[]>);
}
