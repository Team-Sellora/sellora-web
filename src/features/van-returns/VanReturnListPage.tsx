import { Link } from "@tanstack/react-router";
import { PackageOpen, Plus } from "lucide-react";
import { useState } from "react";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { formatOrderDate } from "@/features/orders/format";
import { useVanReturns } from "./hooks";
import { describeVariance, varianceTone } from "./vanReturnView";

const PAGE_SIZE = 20;

/**
 * US-E4-6: the rep's own returns, or the agency's returns — pending
 * acceptance first by default, since that is the operator's to-do list.
 */
export function VanReturnListPage() {
  const { role } = useSelloraAuth();
  const [status, setStatus] = useState<"Declared" | "">(
    role === "AgencyOperator" ? "Declared" : "",
  );
  const query = useVanReturns({ page: 1, pageSize: PAGE_SIZE, ...(status ? { status } : {}) });
  const items = query.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Van returns"
        crumbs={[{ label: "Van returns" }]}
        actions={
          role === "SalesRep" ? (
            <Link
              to="/van-returns/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" /> Return van stock
            </Link>
          ) : undefined
        }
      />

      <div className="mb-3 flex gap-2 text-sm">
        {(["Declared", ""] as const).map((value) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => setStatus(value)}
            className={cn(
              "h-8 rounded-md border px-3",
              status === value ? "border-primary bg-primary/10 font-medium" : "border-border",
            )}
          >
            {value === "Declared" ? "Waiting for acceptance" : "All"}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading van returns…</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : "Van returns could not be loaded."}
        </p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-sm text-muted-foreground">
          <PackageOpen className="size-8" />
          {status === "Declared" ? "Nothing is waiting for acceptance." : "No van returns yet."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Sales rep</th>
                <th className="px-3 py-2">Declared</th>
                <th className="px-3 py-2 text-right">Units declared</th>
                <th className="px-3 py-2 text-right">Counted</th>
                <th className="px-3 py-2">Variance</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.vanReturnId} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link
                      to="/van-returns/$vanReturnId"
                      params={{ vanReturnId: item.vanReturnId }}
                      className="font-mono text-xs font-semibold hover:text-primary hover:underline"
                    >
                      {item.returnReference}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{item.salesRepName ?? "—"}</td>
                  <td className="px-3 py-2">{formatOrderDate(item.declaredAt)}</td>
                  <td className="px-3 py-2 text-right">{item.totalDeclared}</td>
                  <td className="px-3 py-2 text-right">{item.totalCounted ?? "—"}</td>
                  <td
                    className={cn(
                      "px-3 py-2",
                      varianceTone(item.totalVariance) === "short" &&
                        "font-semibold text-destructive",
                    )}
                  >
                    {describeVariance(item.totalVariance)}
                  </td>
                  <td className="px-3 py-2">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
