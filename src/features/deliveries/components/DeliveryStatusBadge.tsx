import { cn } from "@/lib/utils";
import type { DeliveryStatus } from "../types";

export function DeliveryStatusBadge({ status }: Readonly<{ status: DeliveryStatus }>) {
  let colorClass = "";

  switch (status) {
    case "Pending":
      colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      break;
    case "Assigned":
      colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      break;
    case "InTransit":
      colorClass = "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      break;
    case "Delivered":
      colorClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      break;
    case "Failed":
    case "Cancelled":
      colorClass = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
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
