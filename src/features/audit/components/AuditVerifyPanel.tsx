import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { useVerifyAudit } from "../hooks";
import { canVerifyAudit, formatEventType, formatVerificationReason } from "../auditView";

export interface AuditVerifyPanelProps {
  onSelectEntry?: (auditEntryId: string) => void;
}

export function AuditVerifyPanel({ onSelectEntry }: Readonly<AuditVerifyPanelProps>) {
  const { role } = useSelloraAuth();
  const verifyMutation = useVerifyAudit();

  if (!canVerifyAudit(role)) {
    return null;
  }

  const handleVerify = () => {
    verifyMutation.mutate();
  };

  const result = verifyMutation.data;
  const isVerifying = verifyMutation.isPending;

  return (
    <section
      data-testid="audit-verify-panel"
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" />
            Cryptographic Chain Verification
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Verify SHA-256 hash chaining across all sequential audit entries to detect any tampering
            or broken links.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying}
          className="shrink-0 gap-2 text-xs font-semibold"
          data-testid="verify-integrity-button"
        >
          {isVerifying ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Verifying integrity…</span>
            </>
          ) : (
            <>
              <ShieldCheck className="size-3.5" />
              <span>Verify integrity</span>
            </>
          )}
        </Button>
      </div>

      {result && result.verified && (
        <div
          role="status"
          data-testid="verify-success-banner"
          className="mt-4 flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-400"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-semibold">Chain integrity verified</p>
            <p className="text-xs">
              All {result.entriesChecked.toLocaleString()} sequential entries in the cryptographic
              audit chain were verified with valid hash continuity. No tampering detected.
            </p>
          </div>
        </div>
      )}

      {result && !result.verified && result.firstBroken && (
        <div
          role="alert"
          data-testid="verify-failure-banner"
          className="mt-4 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">Cryptographic chain integrity compromised</p>
            <p className="text-xs">
              First broken entry detected at sequence position{" "}
              <span className="font-mono font-semibold">#{result.firstBroken.chainPosition}</span>
              {result.firstBroken.eventType && (
                <> ({formatEventType(result.firstBroken.eventType)})</>
              )}
              .
            </p>
            <p className="text-xs font-medium">
              Reason: {formatVerificationReason(result.firstBroken.reason)}
            </p>
            {result.firstBroken.auditEntryId && onSelectEntry && (
              <button
                type="button"
                onClick={() => onSelectEntry(result.firstBroken!.auditEntryId!)}
                className="mt-2 inline-block text-xs font-semibold underline hover:opacity-80"
                data-testid="inspect-broken-entry-link"
              >
                Inspect broken entry #{result.firstBroken.chainPosition}
              </button>
            )}
          </div>
        </div>
      )}

      {verifyMutation.isError && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
        >
          {verifyMutation.error instanceof Error
            ? verifyMutation.error.message
            : "Verification failed. Please try again."}
        </div>
      )}
    </section>
  );
}
