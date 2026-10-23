import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface RejectReturnDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function RejectReturnDialog({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: Readonly<RejectReturnDialogProps>) {
  const [reason, setReason] = useState("");

  const isInvalid = !reason.trim() || reason.length > 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    try {
      await onSubmit(reason.trim());
      setReason("");
      onClose();
    } catch {
      // Error handled by caller
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reject Return Request</DialogTitle>
            <DialogDescription>
              Provide a clear reason for rejecting this return request. This reason will be recorded
              and visible on the return details.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div>
              <label
                htmlFor="rejection-reason"
                className="text-sm font-medium text-foreground block mb-1.5"
              >
                Rejection Reason (required, max 500 chars)
              </label>
              <Textarea
                id="rejection-reason"
                placeholder="State why this return cannot be accepted..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
                maxLength={500}
                className="min-h-[110px] resize-none"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
              <span>
                {isInvalid && reason.length > 0
                  ? "Reason exceeds 500 characters"
                  : "Mandatory for operator rejection"}
              </span>
              <span className="font-mono">{reason.length} / 500</span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Dismiss
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting || isInvalid}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
