import { ChevronDown, ChevronRight, Loader2, RotateCw } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { formatOrderDate } from "@/features/orders/format";
import { AlertSettingsCard } from "./AlertSettingsCard";
import { useFailedNotifications, useResendNotification } from "./hooks";
import {
  formatEventType,
  formatNotificationStatus,
  formatRecipientKind,
  isWellFormedEmail,
  statusTone,
  unsentRecipients,
} from "./notificationView";
import type { NotificationRequest } from "./types";

const PAGE_SIZE = 20;
const COLUMNS = 7;

/**
 * US-E5-3-F1: notifications that did not reach everyone — still retrying
 * on their own, or given up on — with the reason, the attempts, and a
 * Resend per row. Same table-with-row-action layout as the Area Managers page.
 */
export function FailedNotificationsPage() {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const { data, isPending, isError, error } = useFailedNotifications(page, PAGE_SIZE);
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader
        title="Failed notifications"
        description="Emails to shops and agencies that have not reached everyone. Retrying ones clear on their own; given-up ones need a resend."
        crumbs={[{ label: "Failed notifications" }]}
      />

      <AlertSettingsCard />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Recipients</th>
              <th className="px-4 py-3">Failure reason</th>
              <th className="px-4 py-3 text-right">Attempts</th>
              <th className="px-4 py-3">Last attempt</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isPending &&
              Array.from({ length: 3 }).map((_, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  {Array.from({ length: COLUMNS }).map((__, cell) => (
                    <td key={cell} className="px-4 py-3">
                      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}

            {isError && (
              <tr>
                <td colSpan={COLUMNS} className="px-4 py-8 text-center text-sm text-destructive">
                  Couldn&apos;t load failed notifications: {error.message}
                </td>
              </tr>
            )}

            {!isPending && !isError && data?.items.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  Every notification has reached its shop and agency.
                </td>
              </tr>
            )}

            {!isPending &&
              !isError &&
              data?.items.map((request) => (
                <Fragment key={request.notificationRequestId}>
                  <tr className="border-b border-border align-top last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded(
                            expanded === request.notificationRequestId
                              ? null
                              : request.notificationRequestId,
                          )
                        }
                        className="inline-flex items-center gap-1 font-mono text-xs font-semibold hover:text-primary"
                        aria-expanded={expanded === request.notificationRequestId}
                        aria-label={`Attempt history for ${request.orderReference}`}
                      >
                        {expanded === request.notificationRequestId ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                        {request.orderReference}
                      </button>
                      <div className="mt-1">
                        <StatusChip request={request} />
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatEventType(request.eventType)}</td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {request.recipients.map((recipient) => (
                          <li key={recipient.kind} className="text-xs">
                            <span className="font-medium">
                              {formatRecipientKind(recipient.kind)}
                            </span>{" "}
                            <span className="font-mono text-muted-foreground">
                              {recipient.email ?? "no email"}
                            </span>{" "}
                            <span
                              className={cn(
                                recipient.deliveryStatus === "Sent"
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-destructive",
                              )}
                            >
                              ·{" "}
                              {recipient.deliveryStatus === "Sent"
                                ? "sent"
                                : recipient.deliveryStatus}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs">{request.failureReason ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {request.dispatch.attemptCount}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {request.dispatch.lastAttemptAt
                        ? formatOrderDate(request.dispatch.lastAttemptAt)
                        : "—"}
                      {request.dispatch.nextAttemptAt && (
                        <div>Next try {formatOrderDate(request.dispatch.nextAttemptAt)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setResending(
                            resending === request.notificationRequestId
                              ? null
                              : request.notificationRequestId,
                          )
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold hover:bg-muted"
                      >
                        <RotateCw className="size-3.5" /> Resend
                      </button>
                    </td>
                  </tr>

                  {resending === request.notificationRequestId && (
                    <tr className="border-b border-border bg-muted/30">
                      <td colSpan={COLUMNS} className="px-4 py-3">
                        <ResendForm request={request} onDone={() => setResending(null)} />
                      </td>
                    </tr>
                  )}

                  {expanded === request.notificationRequestId && (
                    <tr className="border-b border-border bg-muted/20">
                      <td colSpan={COLUMNS} className="px-4 py-3">
                        <AttemptHistory request={request} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
          </tbody>
        </table>

        {data && (
          <div className="table-caption flex items-center justify-between gap-3">
            <span>
              Showing {data.items.length} of {data.totalCount} notifications
            </span>
            {totalPages > 1 && (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="underline disabled:opacity-40"
                >
                  Previous
                </button>
                Page {page} of {totalPages}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="underline disabled:opacity-40"
                >
                  Next
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function StatusChip({ request }: Readonly<{ request: NotificationRequest }>) {
  const tone = statusTone(request.status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "danger" && "bg-destructive/10 text-destructive",
        tone === "warning" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        tone === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      {formatNotificationStatus(request.status)}
    </span>
  );
}

/**
 * Resend with the stored addresses, or correct one first (the fix for an
 * invalid or missing address). Recipients already sent to are not shown:
 * they are never sent again.
 */
function ResendForm({
  request,
  onDone,
}: Readonly<{ request: NotificationRequest; onDone: () => void }>) {
  const resend = useResendNotification();
  const targets = unsentRecipients(request);
  const [emails, setEmails] = useState<Record<string, string>>(() =>
    Object.fromEntries(targets.map((recipient) => [recipient.kind, recipient.email ?? ""])),
  );

  const invalid = targets.filter((recipient) => !isWellFormedEmail(emails[recipient.kind] ?? ""));

  async function submit() {
    const corrected = targets
      .filter((recipient) => (emails[recipient.kind] ?? "").trim() !== (recipient.email ?? ""))
      .map((recipient) => ({ kind: recipient.kind, email: (emails[recipient.kind] ?? "").trim() }));

    try {
      const after = await resend.mutateAsync({ id: request.notificationRequestId, corrected });
      if (after.status === "Sent") {
        toast.success(`Notification for ${request.orderReference} sent.`);
      } else {
        toast.warning(
          `Resend attempted for ${request.orderReference}: ${after.failureReason ?? after.status}.`,
        );
      }
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The resend failed.");
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-muted-foreground">
        Sends the same stored message again to the recipients below. Correct an address here if it
        is wrong — and fix it in Shops or Agencies too, so future orders use it.
      </p>
      {targets.map((recipient) => (
        <label key={recipient.kind} className="flex flex-wrap items-center gap-2">
          <span className="w-28 text-xs font-medium">{formatRecipientKind(recipient.kind)}</span>
          <input
            type="email"
            value={emails[recipient.kind] ?? ""}
            onChange={(event) =>
              setEmails((current) => ({ ...current, [recipient.kind]: event.target.value }))
            }
            aria-invalid={!isWellFormedEmail(emails[recipient.kind] ?? "")}
            className={cn(
              "h-8 w-72 rounded-md border bg-background px-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring/40",
              isWellFormedEmail(emails[recipient.kind] ?? "")
                ? "border-input"
                : "border-destructive",
            )}
          />
        </label>
      ))}
      {invalid.length > 0 && (
        <p className="text-xs text-destructive">
          Enter a valid email address for {invalid.map((r) => r.kind).join(" and ")}.
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={resend.isPending || invalid.length > 0}
          onClick={submit}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {resend.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RotateCw className="size-3.5" />
          )}
          Send now
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-8 rounded-md px-3 text-xs text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AttemptHistory({ request }: Readonly<{ request: NotificationRequest }>) {
  const attempts = request.attempts ?? [];

  if (attempts.length === 0) {
    return <p className="text-xs text-muted-foreground">No send attempts yet.</p>;
  }

  return (
    <table className="w-full text-xs">
      <thead className="text-left text-muted-foreground">
        <tr>
          <th className="py-1 pr-3">When</th>
          <th className="py-1 pr-3">Recipient</th>
          <th className="py-1 pr-3">#</th>
          <th className="py-1 pr-3">Outcome</th>
          <th className="py-1 pr-3">Provider said</th>
          <th className="py-1">Triggered by</th>
        </tr>
      </thead>
      <tbody>
        {attempts.map((attempt, index) => (
          <tr key={index} className="border-t border-border/60 align-top">
            <td className="py-1 pr-3">{formatOrderDate(attempt.attemptedAt)}</td>
            <td className="py-1 pr-3">
              {formatRecipientKind(attempt.recipientKind)}{" "}
              <span className="font-mono text-muted-foreground">{attempt.emailAddress ?? "—"}</span>
            </td>
            <td className="py-1 pr-3 tabular-nums">{attempt.attemptNumber}</td>
            <td
              className={cn(
                "py-1 pr-3",
                attempt.outcome === "Sent"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-destructive",
              )}
            >
              {attempt.outcome === "Sent"
                ? "Sent"
                : attempt.outcome === "PermanentFailure"
                  ? "Permanent failure"
                  : "Temporary failure"}
              {attempt.error && <div className="text-muted-foreground">{attempt.error}</div>}
            </td>
            <td className="py-1 pr-3 font-mono">{attempt.providerResponse ?? "—"}</td>
            <td className="py-1">
              {attempt.trigger === "ManualResend"
                ? `Resend (${attempt.triggeredBy ?? "admin"})`
                : "Automatic"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
