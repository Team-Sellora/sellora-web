import { cn } from "@/lib/utils";
import type { ReturnStatus } from "../types";

export function ReturnStatusBadge({ status }: Readonly<{ status: ReturnStatus }>) {
  let colorClass = "";

  switch (status) {
    case "Requested":
      colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
      break;
    case "Approved":
      colorClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
      break;
    case "Rejected":
      colorClass = "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200";
      break;
    default:
      colorClass = "bg-muted text-muted-foreground";
  }

  return (
    <span
      className={cn(
        "status-chip inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        colorClass,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
