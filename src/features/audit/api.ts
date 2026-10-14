import { auditApiFetch } from "@/api/client";
import { AuditApiError } from "./apiError";
import type {
  AuditEntryDetail,
  AuditSearchFilter,
  AuditVerificationResult,
  PagedAuditEntries,
} from "./types";

export function toColomboStartInstant(dateStr: string): string {
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00+05:30`;
  }
  return trimmed;
}

export function toColomboEndInstant(dateStr: string): string {
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T23:59:59+05:30`;
  }
  return trimmed;
}

export function isDateRangeValid(from?: string, to?: string): boolean {
  if (!from || !to) return true;
  const fromClean = from.trim().slice(0, 10);
  const toClean = to.trim().slice(0, 10);
  return fromClean <= toClean;
}

export function isAuditFilterValid(filter: AuditSearchFilter): boolean {
  return isDateRangeValid(filter.from, filter.to);
}

export function buildAuditSearchParams(filter: AuditSearchFilter): URLSearchParams {
  const params = new URLSearchParams();

  if (filter.orderReference?.trim()) {
    params.set("orderReference", filter.orderReference.trim());
  }
  if (filter.aggregateType?.trim()) {
    params.set("aggregateType", filter.aggregateType.trim());
  }
  if (filter.aggregateId?.trim()) {
    params.set("aggregateId", filter.aggregateId.trim());
  }
  if (filter.actorUserId?.trim()) {
    params.set("actorUserId", filter.actorUserId.trim());
  }
  if (filter.eventType?.trim()) {
    params.set("eventType", filter.eventType.trim());
  }
  if (filter.from?.trim()) {
    params.set("from", toColomboStartInstant(filter.from));
  }
  if (filter.to?.trim()) {
    params.set("to", toColomboEndInstant(filter.to));
  }

  params.set("page", String(filter.page ?? 1));
  params.set("pageSize", String(filter.pageSize ?? 20));

  return params;
}

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
    // Keep HTTP status when response is not JSON
  }

  throw new AuditApiError(response.status, detail, title);
}

export function searchAudit(filter: AuditSearchFilter): Promise<PagedAuditEntries> {
  const params = buildAuditSearchParams(filter);
  return auditApiFetch(`/api/audit?${params.toString()}`).then(unwrap<PagedAuditEntries>);
}

export function fetchAuditEntry(auditEntryId: string): Promise<AuditEntryDetail> {
  return auditApiFetch(`/api/audit/${encodeURIComponent(auditEntryId)}`).then(
    unwrap<AuditEntryDetail>,
  );
}

export function verifyAuditChain(): Promise<AuditVerificationResult> {
  return auditApiFetch("/api/audit/verify").then(unwrap<AuditVerificationResult>);
}
