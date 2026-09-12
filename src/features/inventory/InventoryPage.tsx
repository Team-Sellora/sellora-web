import {
  Boxes,
  ClipboardPenLine,
  PackageSearch,
  Plus,
  RefreshCw,
  Warehouse,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { useAdjustStock, useStock } from "./hooks";
import type { StockItem } from "./types";

function shortId(value: string): string {
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
}: Readonly<{
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
}>) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold tracking-tight">{value.toLocaleString()}</span>
        <span className="text-right text-xs text-muted-foreground">{detail}</span>
      </div>
    </div>
  );
}

function AdjustmentDialog({
  stockItem,
  onClose,
}: Readonly<{
  stockItem: StockItem | null;
  onClose: () => void;
}>) {
  const adjustment = useAdjustStock();
  const [inventoryOwnerId, setInventoryOwnerId] = useState(stockItem?.inventoryOwnerId ?? "");
  const [productId, setProductId] = useState(stockItem?.productId ?? "");
  const [batchId, setBatchId] = useState(stockItem?.batchId ?? "");
  const [quantityDelta, setQuantityDelta] = useState("");
  const [reason, setReason] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const delta = Number(quantityDelta);
    if (!Number.isInteger(delta) || delta === 0) {
      toast.error("Enter a whole-number increase or decrease that is not zero.");
      return;
    }

    if (!reason.trim()) {
      toast.error("A reason is required for every stock adjustment.");
      return;
    }

    if (!inventoryOwnerId.trim() || !productId.trim()) {
      toast.error("Inventory owner ID and product ID are required.");
      return;
    }

    try {
      await adjustment.mutateAsync({
        inventoryOwnerId: inventoryOwnerId.trim(),
        productId: productId.trim(),
        batchId: batchId.trim() || null,
        quantityDelta: delta,
        reason: reason.trim(),
      });
      toast.success("Stock adjustment recorded.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Stock adjustment failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={(event) => void submit(event)}
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold">Adjust stock</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every adjustment creates an immutable ledger movement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close adjustment dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {stockItem ? (
            <div className="rounded-md bg-muted/60 p-3 text-sm">
              <div className="font-medium">{stockItem.ownerDisplayName}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Product {shortId(stockItem.productId)} · Available{" "}
                {stockItem.availableQuantity.toLocaleString()}
              </div>
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium">
                Inventory owner ID
                <input
                  required
                  value={inventoryOwnerId}
                  onChange={(event) => setInventoryOwnerId(event.target.value)}
                  placeholder="Inventory owner UUID"
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="block text-sm font-medium">
                Product ID
                <input
                  required
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  placeholder="Product UUID"
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="block text-sm font-medium">
                Batch ID <span className="font-normal text-muted-foreground">(optional)</span>
                <input
                  value={batchId}
                  onChange={(event) => setBatchId(event.target.value)}
                  placeholder="Batch UUID"
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
            </>
          )}

          <label className="block text-sm font-medium">
            Quantity change
            <input
              autoFocus
              required
              inputMode="numeric"
              value={quantityDelta}
              onChange={(event) => setQuantityDelta(event.target.value)}
              placeholder="e.g. 50 or -5"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>

          <label className="block text-sm font-medium">
            Reason
            <textarea
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why this correction is needed"
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-input px-4 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={adjustment.isPending}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <ClipboardPenLine className="size-4" />
            {adjustment.isPending ? "Saving..." : "Record adjustment"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function InventoryPage() {
  const { role } = useSelloraAuth();
  const canAdjust = role === "CompanyAdmin" || role === "AgencyOperator";
  const [productId, setProductId] = useState("");
  const [inventoryOwnerId, setInventoryOwnerId] = useState("");
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);

  const stockQuery = useStock({
    ...(productId.trim() ? { productId: productId.trim() } : {}),
    ...(inventoryOwnerId.trim() ? { inventoryOwnerId: inventoryOwnerId.trim() } : {}),
  });

  const stockItems = useMemo(() => stockQuery.data ?? [], [stockQuery.data]);
  const summary = useMemo(
    () => ({
      onHand: stockItems.reduce((total, item) => total + item.quantityOnHand, 0),
      reserved: stockItems.reduce((total, item) => total + item.quantityReserved, 0),
      available: stockItems.reduce((total, item) => total + item.availableQuantity, 0),
    }),
    [stockItems],
  );

  return (
    <>
      <PageHeader
        title="Inventory"
        description="View stock available to your role across the distribution network."
        crumbs={[{ label: "Inventory" }]}
        actions={
          canAdjust ? (
            <button
              type="button"
              onClick={() => {
                setSelectedStockItem(null);
                setIsAdjustmentOpen(true);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Adjust stock
            </button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="On hand"
          value={summary.onHand}
          detail="Current physical quantity"
          icon={<Boxes className="size-5" />}
        />
        <SummaryCard
          label="Reserved"
          value={summary.reserved}
          detail="Committed to open orders"
          icon={<ClipboardPenLine className="size-5" />}
        />
        <SummaryCard
          label="Available"
          value={summary.available}
          detail="Available for new orders"
          icon={<Warehouse className="size-5" />}
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <label className="relative w-full sm:w-64">
              <span className="sr-only">Filter by product ID</span>
              <PackageSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                placeholder="Filter by product UUID"
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <input
              value={inventoryOwnerId}
              onChange={(event) => setInventoryOwnerId(event.target.value)}
              placeholder="Filter by owner UUID"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40 sm:w-64"
            />
            <button
              type="button"
              onClick={() => {
                setProductId("");
                setInventoryOwnerId("");
              }}
              className="h-9 rounded-md bg-muted px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </button>
          </div>
          <button
            type="button"
            onClick={() => void stockQuery.refetch()}
            disabled={stockQuery.isFetching}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${stockQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {stockQuery.isError && (
          <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {stockQuery.error instanceof Error
              ? stockQuery.error.message
              : "Stock records could not be loaded."}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 text-right font-semibold">On hand</th>
                <th className="px-4 py-3 text-right font-semibold">Reserved</th>
                <th className="px-4 py-3 text-right font-semibold">Available</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                {canAdjust && <th className="px-4 py-3 text-right font-semibold">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stockQuery.isLoading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={canAdjust ? 7 : 6} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))}

              {!stockQuery.isLoading && stockItems.length === 0 && (
                <tr>
                  <td
                    colSpan={canAdjust ? 7 : 6}
                    className="px-4 py-14 text-center text-muted-foreground"
                  >
                    No stock records are available for your current role and filters.
                  </td>
                </tr>
              )}

              {stockItems.map((stockItem) => (
                <tr key={stockItem.stockItemId} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{stockItem.ownerDisplayName}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {stockItem.ownerType} · {shortId(stockItem.inventoryOwnerId)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <div>{shortId(stockItem.productId)}</div>
                    {stockItem.batchId && (
                      <div className="mt-0.5 text-muted-foreground">
                        Batch {shortId(stockItem.batchId)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {stockItem.quantityOnHand.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {stockItem.quantityReserved.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {stockItem.availableQuantity.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(stockItem.updatedAt)}
                  </td>
                  {canAdjust && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStockItem(stockItem);
                          setIsAdjustmentOpen(true);
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Adjust
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        Stock visibility is enforced by the Inventory service from your authenticated JWT. Every
        adjustment records a reason and creates an immutable stock-movement ledger entry.
      </div>

      {isAdjustmentOpen && (
        <AdjustmentDialog
          stockItem={selectedStockItem}
          onClose={() => {
            setIsAdjustmentOpen(false);
            setSelectedStockItem(null);
          }}
        />
      )}
    </>
  );
}
