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
}: RejectReturnDialogProps) {
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
      // Error handled by parent component
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reject Return Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this return request. A reason is mandatory.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Items already past return window or not matching delivery batch..."
              disabled={isSubmitting}
              maxLength={500}
              className="min-h-[100px] text-sm"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{!reason.trim() ? "Reason is required." : ""}</span>
              <span>{reason.length}/500</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting || isInvalid}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
