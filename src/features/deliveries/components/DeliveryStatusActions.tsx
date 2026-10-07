import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateDeliveryStatus } from "../hooks";
import type { DeliveryStatus } from "../types";
import { MarkFailedDialog } from "./MarkFailedDialog";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeliveryApiError } from "../types";

interface DeliveryStatusActionsProps {
  deliveryJobId: string;
  currentStatus: DeliveryStatus;
}

export function DeliveryStatusActions({
  deliveryJobId,
  currentStatus,
}: DeliveryStatusActionsProps) {
  const { mutateAsync: updateStatus, isPending, error } = useUpdateDeliveryStatus();
  const [isFailedDialogOpen, setIsFailedDialogOpen] = useState(false);

  const handleStartDelivery = async () => {
    try {
      await updateStatus({ deliveryJobId, payload: { status: "InTransit" } });
    } catch {
      // Handled by query error state
    }
  };

  const handleMarkDelivered = async () => {
    try {
      await updateStatus({ deliveryJobId, payload: { status: "Delivered" } });
    } catch {
      // Handled by query error state
    }
  };

  const apiErrorDetail =
    error instanceof DeliveryApiError
      ? error.detail || `An unexpected error occurred (Status: ${error.status})`
      : error
        ? error.message
        : undefined;

  // We hide action buttons locally for states that definitely can't transition to prevent UX clutter,
  // but the server remains the ultimate authority on whether a transition is allowed.
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Update Failed</AlertTitle>
          <AlertDescription>{apiErrorDetail}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        {currentStatus === "Assigned" && (
          <Button onClick={handleStartDelivery} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start delivery
          </Button>
        )}

        {currentStatus === "InTransit" && (
          <>
            <Button onClick={handleMarkDelivered} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark delivered
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsFailedDialogOpen(true)}
              disabled={isPending}
            >
              Mark failed
            </Button>
          </>
        )}
      </div>

      <MarkFailedDialog
        isOpen={isFailedDialogOpen}
        deliveryJobId={deliveryJobId}
        onClose={() => setIsFailedDialogOpen(false)}
      />
    </div>
  );
}
