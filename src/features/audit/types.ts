export interface AuditEntrySummary {
  auditEntryId: string;
  chainPosition: number;
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string | null;
  orderReference: string | null;
  actorUserId: string;
  actorRole: string | null;
  occurredAt: string;
  recordedAt: string;
  correlationId: string | null;
  sourceTopic: string;
}

export interface AuditEntryDetail extends AuditEntrySummary {
  schemaVersion: number | null;
  provinceId: string | null;
  partition: number;
  offset: number;
  previousHash: string;
  hash: string;
  payload: string;
}

export interface AuditSearchFilter {
  orderReference?: string | undefined;
  aggregateType?: string | undefined;
  aggregateId?: string | undefined;
  actorUserId?: string | undefined;
  eventType?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface PagedAuditEntries {
  items: AuditEntrySummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export type VerificationFailureReason =
  "HashMismatch" | "PreviousHashMismatch" | "MissingPosition" | (string & {});

export interface VerificationBrokenEntry {
  auditEntryId: string | null;
  chainPosition: number;
  eventType: string | null;
  reason: VerificationFailureReason;
}

export interface AuditVerificationResult {
  verified: boolean;
  entriesChecked: number;
  firstBroken: VerificationBrokenEntry | null;
}
