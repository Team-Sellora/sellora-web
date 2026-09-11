import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChangeProductPrice } from "./hooks";

interface ChangePriceDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  productId: string;
  productName: string;
  currentPrice: number;
}

export function ChangePriceDialog({
  open,
  onOpenChange,
  productId,
  productName,
  currentPrice,
}: Readonly<ChangePriceDialogProps>) {
  const mutation = useChangeProductPrice(productId);
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setPrice("");
      setReason("");
      setEffectiveFrom(new Date().toISOString().slice(0, 16));
      setError("");
    }
  }, [open]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newUnitPrice = Number(price);
    if (!Number.isFinite(newUnitPrice) || newUnitPrice <= 0) {
      setError("Enter a unit price greater than zero.");
      return;
    }
    if (!effectiveFrom) {
      setError("Choose when the new price takes effect.");
      return;
    }
    try {
      await mutation.mutateAsync({
        newUnitPrice,
        reason: reason.trim() || null,
        effectiveFrom: new Date(effectiveFrom).toISOString(),
      });
      toast.success(`Price for ${productName} was updated.`);
      onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The price could not be changed.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change unit price</DialogTitle>
          <DialogDescription>
            This audited change updates the catalogue price and records the reason in price history.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            Current price: <strong>LKR {currentPrice.toFixed(2)}</strong>
          </div>
          <label className="block text-sm font-medium">
            New unit price
            <input
              autoFocus
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Effective from
            <input
              type="datetime-local"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Reason <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background p-3"
              placeholder="Why is this price changing?"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Updating..." : "Confirm price change"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
