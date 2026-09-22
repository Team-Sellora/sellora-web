import { cn } from "@/lib/utils";
import type { OrderStatus } from "./types";

import { formatFulfilmentType, formatOrderStatus } from "./format";
import type { FulfilmentType } from "./types";

const tones: Record<string, string> = {
  AwaitingCheckout: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PendingApproval: "bg-primary/10 text-primary",
  Cancelled: "bg-muted text-muted-foreground",
};

export function OrderStatusBadge({ status }: Readonly<{ status: OrderStatus }>) {
  return (
    <span
      className={cn(
        "status-chip inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        tones[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {formatOrderStatus(status)}
    </span>
  );
}

/** Cash sale vs scheduled delivery, visible without opening the order. */
export function FulfilmentTypeBadge({ type }: Readonly<{ type: FulfilmentType }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        type === "ImmediateCashSale"
          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {formatFulfilmentType(type)}
    </span>
  );
}
