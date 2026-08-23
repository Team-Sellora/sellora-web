import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = Readonly<InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}>;

export function FormField({ label, error, hint, id, className, ...props }: Props) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  let helperText = null;
  if (error) {
    helperText = <p className="text-xs text-destructive">{error}</p>;
  } else if (hint) {
    helperText = <p className="text-xs text-muted-foreground">{hint}</p>;
  }
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={!!error}
        className={cn(
          "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40",
          error ? "border-destructive" : "border-input focus:border-ring",
          className,
        )}
        {...props}
      />
      {helperText}
    </div>
  );
}
