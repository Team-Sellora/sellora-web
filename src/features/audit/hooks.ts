import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { fetchAuditEntry, isAuditFilterValid, searchAudit, verifyAuditChain } from "./api";
import type { AuditSearchFilter } from "./types";

export const auditQueryKey = ["audit"] as const;

export function useAuditSearch(filter: AuditSearchFilter, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...auditQueryKey, "search", filter],
    queryFn: () => searchAudit(filter),
    enabled: isAuditFilterValid(filter) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}

export function useAuditEntry(
  auditEntryId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...auditQueryKey, "entry", auditEntryId],
    queryFn: () => fetchAuditEntry(auditEntryId!),
    enabled: !!auditEntryId && (options?.enabled ?? true),
    retry: false,
  });
}

export function useVerifyAudit() {
  return useMutation({
    mutationFn: verifyAuditChain,
  });
}
