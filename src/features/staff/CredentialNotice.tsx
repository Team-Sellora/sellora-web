import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";

/**
 * Shows a newly created login once. The temporary password is not stored
 * anywhere; if this panel is closed before it is handed over, the admin
 * must reset the password in WSO2 IS.
 */
export function CredentialNotice({
  title,
  userName,
  temporaryPassword,
  children,
  onDismiss,
}: Readonly<{
  title: string;
  userName: string;
  temporaryPassword?: string | null | undefined;
  children?: React.ReactNode;
  onDismiss: () => void;
}>) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(
      temporaryPassword ? `Username: ${userName}\nPassword: ${temporaryPassword}` : userName,
    );
    setCopied(true);
  };

  return (
    <div
      role="status"
      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm"
    >
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-emerald-800 dark:text-emerald-200">{title}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-muted-foreground">Username</dt>
            <dd className="font-mono">{userName}</dd>
            {temporaryPassword && (
              <>
                <dt className="text-muted-foreground">Temporary password</dt>
                <dd className="font-mono">{temporaryPassword}</dd>
              </>
            )}
          </dl>
          <p className="text-xs text-muted-foreground">
            {temporaryPassword
              ? "This password is shown only once. Hand it over now and ask them to change it after first login."
              : "They will receive an email to set their own password."}
          </p>
          {children}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-muted"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy login details"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
