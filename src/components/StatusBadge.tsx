import { cn } from "@/lib/utils";
import type { Status } from "@/lib/mock-data";

export function StatusBadge({ status }: Readonly<{ status: Status }>) {
  return (
    <span
      className={cn(
        "status-chip inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        status === "Active"
          ? "bg-success text-success-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
