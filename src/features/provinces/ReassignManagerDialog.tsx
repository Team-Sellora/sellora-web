import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAreaManagers, useAssignAreaManager } from "./hooks";
import { ApiError, type Province } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  province: Province | null;
}

export function ReassignManagerDialog({
  open,
  onOpenChange,
  province,
}: Readonly<Props>) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const managers = useAreaManagers();
  const assign = useAssignAreaManager();

  // Reset state whenever the dialog opens for a new province, so a stale
  // error from a previous attempt never leaks into a fresh session.
  useEffect(() => {
    if (open) {
      setSelectedId("");
      setFieldError(null);
    }
  }, [open, province?.provinceId]);

  if (!province) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError(null);

    if (!selectedId) {
      // Client-side guard for the empty-selection case — a required field
      // signal without needing a round trip.
      setFieldError("Select an Area Manager to assign.");
      return;
    }

    try {
      await assign.mutateAsync({
        provinceId: province!.provinceId,
        areaManagerId: selectedId,
      });
      onOpenChange(false);
    } catch (err) {
      // Every 4xx from the backend becomes an ApiError carrying the
      // ProblemDetails our controller wrote. `detail` is the human-readable
      // sentence CSP-63 wrote for each outcome — surface it inline.
      if (err instanceof ApiError) {
        setFieldError(err.problem.detail ?? err.problem.title ?? "Assignment failed.");
      } else {
        setFieldError("Unexpected error. Please try again.");
      }
    }
  }

  const isSubmitting = assign.isPending;
  const isManagersLoading = managers.isPending;
  const managersList = managers.data ?? [];
  const hasError = fieldError !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Area Manager</DialogTitle>
            <DialogDescription>
              Province: <span className="font-medium">{province.name}</span>{" "}
              <span className="text-muted-foreground">({province.code})</span>
              {province.currentManager && (
                <>
                  {" · Current: "}
                  <span className="font-medium">
                    {province.currentManager.displayName}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-4">
            <label htmlFor="area-manager-select" className="block text-sm font-medium">
              Area Manager
            </label>

            <Select
              value={selectedId}
              onValueChange={(v) => {
                setSelectedId(v);
                // Clear the field error the moment the user changes selection
                // — the previous error may no longer apply to the new pick.
                setFieldError(null);
              }}
              disabled={isSubmitting || isManagersLoading}
            >
              <SelectTrigger
                id="area-manager-select"
                aria-invalid={hasError}
                aria-describedby={hasError ? "area-manager-error" : undefined}
                className={cn(hasError && "border-destructive focus:ring-destructive/40")}
              >
                <SelectValue
                  placeholder={isManagersLoading ? "Loading…" : "Select an Area Manager"}
                />
              </SelectTrigger>
              <SelectContent>
                {managersList.map((m) => (
                  <SelectItem key={m.staffProfileId} value={m.staffProfileId}>
                    {m.displayName}
                    {m.email && (
                      <span className="ml-2 text-muted-foreground">{m.email}</span>
                    )}
                  </SelectItem>
                ))}
                {!isManagersLoading && managersList.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No active Area Managers in your company.
                  </div>
                )}
              </SelectContent>
            </Select>

            {hasError && (
              <p
                id="area-manager-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {fieldError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isManagersLoading}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}