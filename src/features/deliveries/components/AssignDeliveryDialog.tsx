import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, startOfDay } from "date-fns";
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";

import { useAssignDeliveryJob, useEligibleReps } from "../hooks";
import { DeliveryApiError } from "../types";
import { cn } from "@/lib/utils";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  salesRepId: z.string().min(1, "Please select a sales representative"),
  scheduledDate: z.date({
    required_error: "A scheduled date is required.",
  }),
});

interface AssignDeliveryDialogProps {
  isOpen: boolean;
  deliveryJobId: string;
  onClose: () => void;
}

export function AssignDeliveryDialog({
  isOpen,
  deliveryJobId,
  onClose,
}: AssignDeliveryDialogProps) {
  const { data: reps, isLoading: isLoadingReps } = useEligibleReps(deliveryJobId);
  const {
    mutateAsync: assignJob,
    isPending: isAssigning,
    error: assignError,
  } = useAssignDeliveryJob();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesRepId: "",
      // scheduledDate is left initially undefined
    },
  });

  // Pre-select rep if there's only one
  useEffect(() => {
    if (reps && reps.length === 1 && !form.getValues("salesRepId")) {
      form.setValue("salesRepId", reps[0].salesRepId);
    }
  }, [reps, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await assignJob({
        deliveryJobId,
        payload: {
          salesRepId: values.salesRepId,
          scheduledDate: format(values.scheduledDate, "yyyy-MM-dd"),
        },
      });
      form.reset();
      onClose();
    } catch (err) {
      // Error is handled by react-query and rendered below via assignError
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      onClose();
    }
  };

  const apiErrorDetail =
    assignError instanceof DeliveryApiError
      ? assignError.detail || `An unexpected error occurred (Status: ${assignError.status})`
      : assignError?.message || "An unexpected error occurred.";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Delivery Job</DialogTitle>
          <DialogDescription>
            Select a sales representative and schedule a delivery date for this job.
          </DialogDescription>
        </DialogHeader>

        {assignError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Assignment Failed</AlertTitle>
            <AlertDescription>{apiErrorDetail}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="salesRepId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales Representative</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isLoadingReps ? "Loading reps..." : "Select a sales rep"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reps?.map((rep) => (
                        <SelectItem key={rep.salesRepId} value={rep.salesRepId}>
                          {rep.displayName}
                        </SelectItem>
                      ))}
                      {(!reps || reps.length === 0) && (
                        <SelectItem value="none" disabled>
                          No eligible reps found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Scheduled Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < startOfDay(new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAssigning}>
                {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Job
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
