import { cn } from "@/lib/utils";
import type { Status } from "@/lib/mock-data";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status === "Active"
          ? "bg-success text-success-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
