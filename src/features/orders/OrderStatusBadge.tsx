import { cn } from "@/lib/utils";
import type { OrderStatus } from "./types";

const tones: Record<string, string> = {
  Submitted: "bg-primary/10 text-primary",
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
      {status}
    </span>
  );
}
