import { useState, type FormEvent } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AuditSearchFilter } from "../types";
import { isDateRangeValid } from "../api";

export interface AuditFilterFormProps {
  initialFilter: AuditSearchFilter;
  onApply: (filter: AuditSearchFilter) => void;
  onReset: () => void;
}

export function AuditFilterForm({
  initialFilter,
  onApply,
  onReset,
}: Readonly<AuditFilterFormProps>) {
  const [orderReference, setOrderReference] = useState(initialFilter.orderReference ?? "");
  const [eventType, setEventType] = useState(initialFilter.eventType ?? "");
  const [aggregateType, setAggregateType] = useState(initialFilter.aggregateType ?? "");
  const [aggregateId, setAggregateId] = useState(initialFilter.aggregateId ?? "");
  const [actorUserId, setActorUserId] = useState(initialFilter.actorUserId ?? "");
  const [from, setFrom] = useState(initialFilter.from ?? "");
  const [to, setTo] = useState(initialFilter.to ?? "");

  const dateRangeValid = isDateRangeValid(from, to);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!dateRangeValid) return;

    onApply({
      orderReference: orderReference.trim() || undefined,
      eventType: eventType.trim() || undefined,
      aggregateType: aggregateType.trim() || undefined,
      aggregateId: aggregateId.trim() || undefined,
      actorUserId: actorUserId.trim() || undefined,
      from: from.trim() || undefined,
      to: to.trim() || undefined,
      page: 1,
      pageSize: 20,
    });
  };

  const handleReset = () => {
    setOrderReference("");
    setEventType("");
    setAggregateType("");
    setAggregateId("");
    setActorUserId("");
    setFrom("");
    setTo("");
    onReset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm"
      data-testid="audit-filter-form"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div>
          <label
            htmlFor="filter-order-ref"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Order Reference
          </label>
          <Input
            id="filter-order-ref"
            placeholder="e.g. ORD-1001"
            value={orderReference}
            onChange={(e) => setOrderReference(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div>
          <label
            htmlFor="filter-event-type"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Event Type
          </label>
          <Input
            id="filter-event-type"
            placeholder="e.g. order.placed"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div>
          <label
            htmlFor="filter-aggregate-type"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Aggregate Type
          </label>
          <Input
            id="filter-aggregate-type"
            placeholder="e.g. Order, Delivery"
            value={aggregateType}
            onChange={(e) => setAggregateType(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div>
          <label
            htmlFor="filter-aggregate-id"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Aggregate ID
          </label>
          <Input
            id="filter-aggregate-id"
            placeholder="UUID or reference"
            value={aggregateId}
            onChange={(e) => setAggregateId(e.target.value)}
            className="h-8 text-xs font-mono"
          />
        </div>

        <div>
          <label
            htmlFor="filter-actor"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Actor User ID
          </label>
          <Input
            id="filter-actor"
            placeholder="UUID of actor"
            value={actorUserId}
            onChange={(e) => setActorUserId(e.target.value)}
            className="h-8 text-xs font-mono"
          />
        </div>

        <div>
          <label
            htmlFor="filter-from-date"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            From Date (Colombo)
          </label>
          <Input
            id="filter-from-date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div>
          <label
            htmlFor="filter-to-date"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            To Date (Colombo)
          </label>
          <Input
            id="filter-to-date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex items-end gap-2">
          <Button
            type="submit"
            disabled={!dateRangeValid}
            size="sm"
            className="h-8 flex-1 gap-1.5 text-xs font-medium"
          >
            <Filter className="size-3.5" />
            <span>Apply filters</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 gap-1.5 text-xs"
            title="Reset all filters"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {!dateRangeValid && (
        <div
          role="alert"
          data-testid="filter-date-error"
          className="rounded border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"
        >
          From date cannot be after To date.
        </div>
      )}
    </form>
  );
}
