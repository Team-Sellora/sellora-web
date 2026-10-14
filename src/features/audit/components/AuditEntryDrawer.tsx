import { useState } from "react";
import { Check, Copy, ExternalLink, Hash, Loader2, MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuditEntry } from "../hooks";
import { AuditApiError } from "../apiError";
import {
  extractCheckInCoordinates,
  formatAuditTimestamp,
  formatEventType,
  formatPayload,
  googleMapsUrl,
  shortenHash,
} from "../auditView";

export interface AuditEntryDrawerProps {
  auditEntryId: string | null | undefined;
  isOpen: boolean;
  onClose: () => void;
}

function HashField({
  label,
  hash,
}: Readonly<{
  label: string;
  hash: string;
}>) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed
    }
  };

  if (!hash) {
    return (
      <div>
        <dt className="text-xs text-muted-foreground uppercase">{label}</dt>
        <dd className="font-mono text-xs text-muted-foreground">None</dd>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <dt className="text-xs text-muted-foreground uppercase">{label}</dt>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-600" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <dd className="mt-1">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left font-mono text-xs text-foreground hover:underline break-all"
          title="Click to toggle full hash"
        >
          {expanded ? hash : shortenHash(hash, 10, 10)}
        </button>
      </dd>
    </div>
  );
}

export function AuditEntryDrawer({
  auditEntryId,
  isOpen,
  onClose,
}: Readonly<AuditEntryDrawerProps>) {
  const { data: entry, isLoading, error } = useAuditEntry(auditEntryId, { enabled: isOpen });
  const [payloadCopied, setPayloadCopied] = useState(false);

  const handleCopyPayload = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setPayloadCopied(true);
      setTimeout(() => setPayloadCopied(false), 2000);
    } catch {
      // Clipboard write failed
    }
  };

  const coordinates = entry?.payload ? extractCheckInCoordinates(entry.payload) : null;
  const isPayment = entry?.eventType?.toLowerCase().includes("payment");

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-xl md:max-w-2xl"
        data-testid="audit-entry-drawer"
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Hash className="size-5 text-primary" />
            {entry
              ? `Entry #${entry.chainPosition} — ${formatEventType(entry.eventType)}`
              : "Audit Entry Details"}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {entry
              ? `Event ID: ${entry.eventId} • Recorded: ${formatAuditTimestamp(entry.recordedAt)}`
              : "Cryptographic audit trail verification and immutable event record."}
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm">Loading audit entry details…</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="my-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error instanceof AuditApiError && error.status === 404
              ? "This audit entry does not exist or is outside your scope."
              : error.message || "Could not load audit entry details."}
          </div>
        )}

        {entry && (
          <div className="space-y-6 pt-4 text-sm">
            <section className="space-y-3">
              <h4 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                Metadata
              </h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Chain Position</dt>
                  <dd className="font-mono font-medium">#{entry.chainPosition}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Event Type</dt>
                  <dd className="flex items-center gap-1.5 font-medium">
                    <span>{formatEventType(entry.eventType)}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {entry.eventType}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Occurred At (Colombo)</dt>
                  <dd className="font-medium">{formatAuditTimestamp(entry.occurredAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Recorded At (Colombo)</dt>
                  <dd className="font-medium">{formatAuditTimestamp(entry.recordedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Actor</dt>
                  <dd className="font-mono text-xs">
                    {entry.actorUserId}
                    {entry.actorRole && (
                      <span className="ml-1 text-muted-foreground font-sans">
                        ({entry.actorRole})
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Correlation ID</dt>
                  <dd className="font-mono text-xs text-muted-foreground">
                    {entry.correlationId || "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Aggregate</dt>
                  <dd className="font-medium">
                    {entry.aggregateType}
                    {entry.aggregateId && (
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        ({entry.aggregateId})
                      </span>
                    )}
                  </dd>
                </div>
                {entry.orderReference && (
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase">Order Reference</dt>
                    <dd className="font-mono font-semibold text-primary">{entry.orderReference}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Kafka Stream</dt>
                  <dd className="font-mono text-xs">
                    {entry.sourceTopic} [p:{entry.partition}, o:{entry.offset}]
                  </dd>
                </div>
                {entry.provinceId && (
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase">Province ID</dt>
                    <dd className="font-mono text-xs">{entry.provinceId}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                Cryptographic Chain Hashes
              </h4>
              <dl className="space-y-3">
                <HashField label="Previous Entry Hash" hash={entry.previousHash} />
                <HashField label="Current Entry Hash" hash={entry.hash} />
              </dl>
            </section>

            {(isPayment || coordinates) && (
              <section className="rounded-lg border border-border bg-card p-4">
                <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                  <MapPin className="size-3.5 text-primary" />
                  Sales Rep Check-In Coordinates
                </h4>
                {coordinates ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs">
                      Latitude: {coordinates.latitude.toFixed(6)}, Longitude:{" "}
                      {coordinates.longitude.toFixed(6)}
                    </span>
                    <a
                      href={googleMapsUrl(coordinates.latitude, coordinates.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>View on Google Maps</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No GPS coordinates recorded in this payment event payload.
                  </p>
                )}
              </section>
            )}

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                  Event Payload (Raw JSON)
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyPayload(entry.payload)}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  {payloadCopied ? (
                    <>
                      <Check className="size-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </Button>
              </div>
              <pre className="max-h-96 overflow-x-auto rounded-md border border-border bg-muted/60 p-3 font-mono text-xs leading-relaxed text-foreground select-all">
                {formatPayload(entry.payload)}
              </pre>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
