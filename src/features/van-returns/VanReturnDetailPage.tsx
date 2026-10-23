import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { formatOrderDate } from "@/features/orders/format";
import { productInputClass } from "@/features/products/productFormStyles";
import { useAcceptVanReturn, useVanReturn } from "./hooks";
import type { VanReturn } from "./types";
import { countedQuantityError, describeVariance, variance, varianceTone } from "./vanReturnView";

/**
 * US-E4-6: one van return. For the rep's agency operator while it is
 * Declared, this is the acceptance screen: a counted box per line and the
 * variance beside it, live, with the total variance as the headline.
 */
export function VanReturnDetailPage({ vanReturnId }: Readonly<{ vanReturnId: string }>) {
  const query = useVanReturn(vanReturnId);
  const crumbs = [{ label: "Van returns", to: "/van-returns" }, { label: "Return" }];

  if (query.isLoading) {
    return (
      <>
        <PageHeader title="Van return" crumbs={crumbs} />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <PageHeader title="Van return" crumbs={crumbs} />
        <p className="text-sm text-destructive">
          {query.error instanceof Error
            ? query.error.message
            : "The van return could not be loaded."}
        </p>
      </>
    );
  }

  return <VanReturnView vanReturn={query.data} crumbs={crumbs} />;
}

function VanReturnView({
  vanReturn,
  crumbs,
}: Readonly<{ vanReturn: VanReturn; crumbs: { label: string; to?: string }[] }>) {
  const { role } = useSelloraAuth();
  const accept = useAcceptVanReturn(vanReturn.vanReturnId);
  const canAccept = role === "AgencyOperator" && vanReturn.status === "Declared";
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const rows = vanReturn.lines.map((line) => {
    const raw = counts[line.productId];
    const counted = canAccept
      ? raw === undefined || raw.trim() === ""
        ? null
        : Number(raw)
      : line.countedQuantity;
    return {
      ...line,
      counted,
      variance: variance(line.declaredQuantity, counted),
      error: canAccept ? countedQuantityError(counted, line.declaredQuantity) : null,
    };
  });

  const allCounted = rows.every((row) => row.counted !== null && row.error === null);
  const totalVariance = allCounted
    ? rows.reduce((sum, row) => sum + (row.variance ?? 0), 0)
    : vanReturn.totalVariance;

  async function submit() {
    try {
      await accept.mutateAsync({
        lines: rows.map((row) => ({ productId: row.productId, countedQuantity: row.counted ?? 0 })),
        note,
      });
      toast.success(
        `Van return ${vanReturn.returnReference} accepted. The counted stock moves to your agency.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The van return could not be accepted.");
    }
  }

  return (
    <>
      <PageHeader title={vanReturn.returnReference} crumbs={crumbs} />

      <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-4">
        <Fact label="Status" value={vanReturn.status} />
        <Fact label="Sales rep" value={vanReturn.salesRepName ?? "—"} />
        <Fact label="Declared" value={formatOrderDate(vanReturn.declaredAt)} />
        <Fact
          label="Accepted"
          value={vanReturn.acceptedAt ? formatOrderDate(vanReturn.acceptedAt) : "—"}
        />
      </dl>

      {/* The variance is the signal the agency needs, so it leads. */}
      <div
        className={cn(
          "mb-4 flex items-center gap-3 rounded-lg border p-4",
          varianceTone(totalVariance ?? null) === "short"
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "border-border bg-card",
        )}
        role="status"
      >
        {varianceTone(totalVariance ?? null) === "short" ? (
          <AlertTriangle className="size-6 shrink-0" />
        ) : (
          <CheckCircle2 className="size-6 shrink-0 text-muted-foreground" />
        )}
        <div>
          <p className="text-xs uppercase tracking-wide">Total variance</p>
          <p className="text-2xl font-semibold">{describeVariance(totalVariance ?? null)}</p>
          <p className="text-xs opacity-80">
            Declared {vanReturn.totalDeclared}
            {totalVariance != null && ` · counted ${vanReturn.totalDeclared - totalVariance}`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2 text-right">Declared</th>
              <th className="px-3 py-2">Counted</th>
              <th className="px-3 py-2">Variance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.vanReturnLineId} className="border-t border-border align-top">
                <td className="px-3 py-2">{row.productName ?? row.productId}</td>
                <td className="px-3 py-2 text-right">{row.declaredQuantity}</td>
                <td className="px-3 py-2">
                  {canAccept ? (
                    <>
                      <input
                        type="number"
                        min={0}
                        max={row.declaredQuantity}
                        inputMode="numeric"
                        aria-label={`Counted quantity of ${row.productName ?? "product"}`}
                        value={counts[row.productId] ?? ""}
                        onChange={(event) =>
                          setCounts((current) => ({
                            ...current,
                            [row.productId]: event.target.value,
                          }))
                        }
                        className={cn(
                          productInputClass(row.error != null && counts[row.productId] != null),
                          "w-28",
                        )}
                      />
                      {row.error && counts[row.productId] != null && (
                        <p className="mt-1 text-xs text-destructive">{row.error}</p>
                      )}
                    </>
                  ) : (
                    (row.counted ?? "—")
                  )}
                </td>
                <td
                  className={cn(
                    "px-3 py-2",
                    varianceTone(row.variance) === "short" && "font-semibold text-destructive",
                  )}
                >
                  {describeVariance(row.variance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vanReturn.acceptanceNote && (
        <p className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-sm">
          “{vanReturn.acceptanceNote}”
        </p>
      )}

      {canAccept && (
        <div className="mt-4">
          <label htmlFor="acceptance-note" className="text-xs font-medium uppercase tracking-wide">
            Note (optional — e.g. why the count is short)
          </label>
          <textarea
            id="acceptance-note"
            value={note}
            maxLength={500}
            rows={2}
            onChange={(event) => setNote(event.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="button"
            disabled={!allCounted || accept.isPending}
            onClick={submit}
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {accept.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Accept counted stock
          </button>
        </div>
      )}
    </>
  );
}

function Fact({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
