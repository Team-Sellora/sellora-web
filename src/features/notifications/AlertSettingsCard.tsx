import { BellRing, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNotificationSettings, useUpdateNotificationSettings } from "./hooks";
import { isWellFormedEmail } from "./notificationView";

/**
 * US-E5-4: where company alerts go. Low-stock notifications are sent to
 * the agency holding the stock and to this address; without one, the
 * company-admin copy shows up below as "no email".
 */
export function AlertSettingsCard() {
  const settings = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(settings.data?.alertEmail ?? "");
  }, [settings.data?.alertEmail]);

  const trimmed = email.trim();
  const valid = trimmed === "" || isWellFormedEmail(trimmed);
  const unchanged = trimmed === (settings.data?.alertEmail ?? "");

  async function save() {
    try {
      await update.mutateAsync(trimmed === "" ? null : trimmed);
      toast.success(
        trimmed === "" ? "Company alert address removed." : `Company alerts will go to ${trimmed}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The address could not be saved.");
    }
  }

  return (
    <section className="mb-4 rounded-lg border border-border bg-card p-4 text-sm">
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="flex-1">
          <h2 className="font-semibold">Company alert address</h2>
          <p className="text-xs text-muted-foreground">
            Low-stock alerts go to the agency holding the stock and to this address. Shops are never
            sent stock alerts.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="email"
              placeholder="ops@yourcompany.lk"
              value={email}
              disabled={settings.isPending}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Company alert address"
              aria-invalid={!valid}
              className={cn(
                "h-8 w-72 rounded-md border bg-background px-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring/40",
                valid ? "border-input" : "border-destructive",
              )}
            />
            <button
              type="button"
              disabled={!valid || unchanged || update.isPending}
              onClick={save}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {update.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Save
            </button>
            {!settings.isPending && !settings.data?.alertEmail && (
              <span className="text-xs text-amber-700 dark:text-amber-400">
                Not set — company low-stock alerts can&apos;t be delivered.
              </span>
            )}
          </div>
          {!valid && (
            <p className="mt-1 text-xs text-destructive">
              Enter a valid email address, or leave it empty.
            </p>
          )}
          {settings.isError && (
            <p className="mt-1 text-xs text-destructive">
              Couldn&apos;t load the setting: {settings.error.message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
