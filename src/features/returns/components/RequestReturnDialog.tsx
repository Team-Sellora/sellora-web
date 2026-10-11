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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type { DeliveryLine } from "@/features/deliveries/types";
import { ReturnApiError, type CreateReturnResponse } from "../types";
import { useCreateReturn } from "../hooks";

interface RequestReturnDialogProps {
  deliveryJobId: string;
  lines: DeliveryLine[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created: CreateReturnResponse) => void;
}

export function RequestReturnDialog({
  deliveryJobId,
  lines,
  isOpen,
  onClose,
  onSuccess,
}: RequestReturnDialogProps) {
  const { mutateAsync: submitReturn, isPending } = useCreateReturn();

  // State keyed by product id
  const [lineValues, setLineValues] = useState<
    Record<string, { quantity: number; reason: string }>
  >({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});

  const getLineKey = (line: DeliveryLine) => line.productId ?? line.id;

  const handleQuantityChange = (line: DeliveryLine, rawValue: string) => {
    const key = getLineKey(line);
    const parsed = parseInt(rawValue, 10);
    // Cap at line's returnableQuantity, min 0
    const clamped = isNaN(parsed) ? 0 : Math.max(0, Math.min(line.returnableQuantity, parsed));

    setLineValues((prev) => ({
      ...prev,
      [key]: {
        quantity: clamped,
        reason: prev[key]?.reason ?? "",
      },
    }));

    if (lineErrors[key]) {
      setLineErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleReasonChange = (line: DeliveryLine, reason: string) => {
    const key = getLineKey(line);
    setLineValues((prev) => ({
      ...prev,
      [key]: {
        quantity: prev[key]?.quantity ?? 0,
        reason,
      },
    }));

    if (lineErrors[key]) {
      setLineErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const activeLines = lines.filter((line) => {
    const key = getLineKey(line);
    return (lineValues[key]?.quantity ?? 0) > 0;
  });

  const hasAtLeastOne = activeLines.length > 0;
  const allActiveValid = activeLines.every((line) => {
    const key = getLineKey(line);
    const reason = lineValues[key]?.reason ?? "";
    return reason.trim().length > 0 && reason.length <= 500;
  });

  const isSubmitDisabled = isPending || !hasAtLeastOne || !allActiveValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setGeneralError(null);
    setLineErrors({});

    // Lines left at 0 are omitted per specification
    const linesToSubmit = activeLines.map((line) => {
      const key = getLineKey(line);
      return {
        productId: key,
        quantity: lineValues[key]?.quantity ?? 0,
        reason: lineValues[key]?.reason?.trim() ?? "",
      };
    });

    try {
      const result = await submitReturn({
        deliveryJobId,
        lines: linesToSubmit,
      });
      setLineValues({});
      onSuccess(result);
      onClose();
    } catch (err) {
      if (err instanceof ReturnApiError) {
        if (err.status === 400 && err.lineErrors && err.lineErrors.length > 0) {
          const map: Record<string, string> = {};
          let matched = false;
          for (const le of err.lineErrors) {
            map[le.productId] = le.message;
            if (linesToSubmit.some((l) => l.productId === le.productId)) {
              matched = true;
            }
          }
          setLineErrors(map);
          // Show general detail text if there is no line match
          if (!matched && err.detail) {
            setGeneralError(err.detail);
          }
        } else {
          setGeneralError(err.detail ?? err.message);
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError("An unexpected error occurred.");
      }
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          setGeneralError(null);
          setLineErrors({});
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>
              Select quantities and enter reasons for returned products. Only lines with quantity
              greater than 0 will be submitted.
            </DialogDescription>
          </DialogHeader>

          {generalError && (
            <div className="mt-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Return Request Failed</AlertTitle>
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="py-4 space-y-4">
            {lines.map((line) => {
              const key = getLineKey(line);
              const qty = lineValues[key]?.quantity ?? 0;
              const reason = lineValues[key]?.reason ?? "";
              const lineError = lineErrors[key];
              const isSelected = qty > 0;

              return (
                <div
                  key={key}
                  className="rounded-lg border border-border p-4 bg-muted/20 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{line.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        Delivered: {line.quantity} | Returnable:{" "}
                        <span className="font-semibold text-foreground">
                          {line.returnableQuantity}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label htmlFor={`qty-${key}`} className="text-xs text-muted-foreground">
                        Qty to return:
                      </label>
                      <Input
                        id={`qty-${key}`}
                        type="number"
                        min={0}
                        max={line.returnableQuantity}
                        value={qty}
                        disabled={isPending || line.returnableQuantity === 0}
                        onChange={(e) => handleQuantityChange(line, e.target.value)}
                        className="w-24 h-8 text-sm text-right"
                      />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="pt-1">
                      <label
                        htmlFor={`reason-${key}`}
                        className="text-xs text-muted-foreground block mb-1"
                      >
                        Return reason (required, max 500):
                      </label>
                      <Textarea
                        id={`reason-${key}`}
                        value={reason}
                        disabled={isPending}
                        maxLength={500}
                        placeholder="E.g., Damaged items, expired stock..."
                        onChange={(e) => handleReasonChange(line, e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{!reason.trim() ? "Reason is required." : ""}</span>
                        <span>{reason.length}/500</span>
                      </div>
                    </div>
                  )}

                  {lineError && (
                    <p className="text-xs font-medium text-destructive mt-1" role="alert">
                      {lineError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Return Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
