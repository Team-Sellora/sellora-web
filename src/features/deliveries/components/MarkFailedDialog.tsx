import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle } from "lucide-react";

import { useUpdateDeliveryStatus } from "../hooks";
import { DeliveryApiError } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "A reason is required to mark a delivery as failed.")
    .max(500, "Maximum 500 characters."),
});

interface MarkFailedDialogProps {
  isOpen: boolean;
  deliveryJobId: string;
  onClose: () => void;
}

export function MarkFailedDialog({ isOpen, deliveryJobId, onClose }: MarkFailedDialogProps) {
  const { mutateAsync: updateStatus, isPending, error } = useUpdateDeliveryStatus();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
    mode: "onChange",
  });

  const reason = form.watch("reason");
  const isSubmitDisabled = isPending || !reason.trim();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateStatus({
        deliveryJobId,
        payload: {
          status: "Failed",
          reason: values.reason,
        },
      });
      form.reset();
      onClose();
    } catch (err) {
      // Error handled by react-query and rendered below via error state
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      onClose();
    }
  };

  const apiErrorDetail =
    error instanceof DeliveryApiError
      ? error.detail || `An unexpected error occurred (Status: ${error.status})`
      : error
        ? error.message
        : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark Delivery as Failed</DialogTitle>
          <DialogDescription>
            Please provide a reason why this delivery job failed.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Update Failed</AlertTitle>
            <AlertDescription>{apiErrorDetail}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for failure..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitDisabled}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Failure
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
