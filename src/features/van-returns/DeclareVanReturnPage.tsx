import { useNavigate } from "@tanstack/react-router";
import { Loader2, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useStock } from "@/features/inventory/hooks";
import { useOrderCatalogue } from "@/features/orders/hooks";
import { productInputClass } from "@/features/products/productFormStyles";
import { useDeclareVanReturn } from "./hooks";
import { VanReturnApiError } from "./types";
import { declaredQuantityError, returnableByProduct } from "./vanReturnView";

/**
 * US-E4-6: the rep lists what is left in the van and declares how much goes
 * back. Limits come from the van's own stock; the server checks again.
 */
export function DeclareVanReturnPage() {
  const navigate = useNavigate();
  const stockQuery = useStock({});
  const catalogue = useOrderCatalogue();
  const declare = useDeclareVanReturn();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const returnable = useMemo(() => returnableByProduct(stockQuery.data ?? []), [stockQuery.data]);
  const names = useMemo(
    () => new Map((catalogue.data ?? []).map((product) => [product.productId, product.name])),
    [catalogue.data],
  );
  const products = [...returnable.entries()]
    .filter(([, held]) => held > 0)
    .sort(([a], [b]) => (names.get(a) ?? a).localeCompare(names.get(b) ?? b));

  const parsed = products.map(([productId, held]) => {
    const raw = quantities[productId] ?? "";
    const quantity = raw.trim() === "" ? 0 : Number(raw);
    return { productId, held, quantity, error: declaredQuantityError(quantity, held) };
  });
  const toReturn = parsed.filter((line) => line.quantity > 0);
  const hasErrors = parsed.some((line) => line.error);

  async function submit() {
    setFormError(null);
    if (toReturn.length === 0) {
      setFormError("Enter a quantity for at least one product.");
      return;
    }
    try {
      const created = await declare.mutateAsync(
        toReturn.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      );
      toast.success(`Van return ${created.returnReference} sent to your agency for counting.`);
      await navigate({
        to: "/van-returns/$vanReturnId",
        params: { vanReturnId: created.vanReturnId },
      });
    } catch (error) {
      setFormError(
        error instanceof VanReturnApiError || error instanceof Error
          ? error.message
          : "The return could not be declared.",
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Return van stock"
        crumbs={[{ label: "Van returns", to: "/van-returns" }, { label: "New" }]}
      />
      <p className="mb-4 text-sm text-muted-foreground">
        Enter what you are handing back to your agency. The agency counts it and only the counted
        quantity leaves your van.
      </p>

      {stockQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your van stock…</p>
      ) : products.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Your van has no stock that can be returned.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">In your van</th>
                <th className="px-3 py-2">Returning</th>
              </tr>
            </thead>
            <tbody>
              {parsed.map((line) => (
                <tr key={line.productId} className="border-t border-border align-top">
                  <td className="px-3 py-2">{names.get(line.productId) ?? line.productId}</td>
                  <td className="px-3 py-2 text-right">{line.held}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={line.held}
                      inputMode="numeric"
                      aria-label={`Quantity of ${names.get(line.productId) ?? "product"} to return`}
                      value={quantities[line.productId] ?? ""}
                      onChange={(event) =>
                        setQuantities((current) => ({
                          ...current,
                          [line.productId]: event.target.value,
                        }))
                      }
                      className={cn(productInputClass(line.error != null), "w-28")}
                    />
                    {line.error && <p className="mt-1 text-xs text-destructive">{line.error}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formError && (
        <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}

      <button
        type="button"
        disabled={declare.isPending || hasErrors || products.length === 0}
        onClick={submit}
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {declare.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Undo2 className="size-4" />
        )}
        Declare return
      </button>
    </>
  );
}
