import { format } from "date-fns";
import type { DeliveryStatusHistoryEntry } from "../types";
import { DeliveryStatusBadge } from "./DeliveryStatusBadge";

export function DeliveryStatusHistory({ history }: { history: DeliveryStatusHistoryEntry[] }) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-muted-foreground">No history available.</p>;
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="size-2 rounded-full bg-border mt-1.5" />
            {index < history.length - 1 && <div className="w-px h-full bg-border my-1" />}
          </div>
          <div className="pb-4">
            <div className="flex items-center gap-2">
              <DeliveryStatusBadge status={entry.status} />
              <span className="text-sm font-medium">{entry.actorRole}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(entry.occurredAt), "PPp")}
              </span>
            </div>
            {entry.reason && <p className="mt-1 text-sm text-muted-foreground">{entry.reason}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
