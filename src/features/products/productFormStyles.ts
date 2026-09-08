import { cn } from "@/lib/utils";

export function productInputClass(hasError: boolean) {
  return cn(
    "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40",
    hasError ? "border-destructive text-destructive" : "border-input focus:border-ring",
  );
}
