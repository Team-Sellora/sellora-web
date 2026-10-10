import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { useSubmitDeliveryConfirmation } from "../hooks";
import type { DeliveryConfirmation } from "../types";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeliveryApiError } from "../types";
import { ReportProblemDialog } from "./ReportProblemDialog";

interface DeliveryConfirmationActionsProps {
  deliveryJobId: string;
  confirmation: DeliveryConfirmation | null;
}

export function DeliveryConfirmationActions({
  deliveryJobId,
  confirmation,
}: DeliveryConfirmationActionsProps) {
  const { role } = useSelloraAuth();
  const { mutateAsync: submitConfirmation, isPending, error } = useSubmitDeliveryConfirmation();
  const [isReportProblemOpen, setIsReportProblemOpen] = useState(false);

  // We trust the backend's confirmation field as the sole source of truth.
  // It is only present and applicable if the job is Delivered and not a cash-sale.
  // The section stays visible read-only after submitting so the shop owner can verify their action.
  if (role !== "ShopOwner" || !confirmation) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      await submitConfirmation({
        deliveryJobId,
        payload: { outcome: "Confirmed" },
      });
    } catch {
      // Error handled by query error state
    }
  };

  const handleReportProblem = async (note: string) => {
    await submitConfirmation({
      deliveryJobId,
      payload: { outcome: "Disputed", note },
    });
  };

  const apiErrorDetail =
    error instanceof DeliveryApiError
      ? error.detail || `An unexpected error occurred (Status: ${error.status})`
      : error
        ? error.message
        : undefined;

  return (
    <>
      <h4 className="mb-3 mt-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Confirmation
      </h4>
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Confirmation Failed</AlertTitle>
            <AlertDescription>{apiErrorDetail}</AlertDescription>
          </Alert>
        )}

        {confirmation.state === "Awaiting" ? (
          <div className="flex gap-2">
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending && !isReportProblemOpen && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm receipt
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsReportProblemOpen(true)}
              disabled={isPending}
            >
              Report a problem
            </Button>
          </div>
        ) : (
          <div className="rounded-md bg-muted p-4 text-sm">
            <p className="font-medium mb-1">
              {confirmation.state === "Confirmed" ? "Receipt confirmed" : "Problem reported"}
            </p>
            {confirmation.note && (
              <p className="text-muted-foreground mt-2">Note: {confirmation.note}</p>
            )}
            {confirmation.time && (
              <p className="text-xs text-muted-foreground mt-2">
                Recorded at: {new Date(confirmation.time).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <ReportProblemDialog
          isOpen={isReportProblemOpen}
          isSubmitting={isPending}
          onClose={() => setIsReportProblemOpen(false)}
          onSubmit={handleReportProblem}
        />
      </div>
    </>
  );
}
