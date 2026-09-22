import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Banknote,
  ClipboardPlus,
  Info,
  Plus,
  Send,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import { useMemo, useRef, useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { FieldError, FieldLabel } from "@/features/products/ProductCoreFields";
import { productInputClass } from "@/features/products/productFormStyles";
import { formatLkr } from "./format";
import { useCreateOrder, useOrderableShops, useOrderCatalogue } from "./hooks";
import { hasValidationErrors, MAX_ORDER_LINES, validateCreateOrder } from "./validation";
import {
  OrderApiError,
  type CreateOrderFormErrors,
  type CreateOrderFormValues,
  type OrderLineFormValues,
} from "./types";

export function CreateOrderPage() {
  const navigate = useNavigate();
  const shopsQuery = useOrderableShops();
  const catalogueQuery = useOrderCatalogue();
  const createMutation = useCreateOrder();

  const nextKey = useRef(1);
  const newLine = (): OrderLineFormValues => ({
    key: String(nextKey.current++),
    productId: "",
    quantity: "1",
  });

  const [values, setValues] = useState<CreateOrderFormValues>(() => ({
    shopId: "",
    fulfilmentType: "ScheduledDelivery",
    lines: [{ key: "0", productId: "", quantity: "1" }],
  }));
  const [errors, setErrors] = useState<CreateOrderFormErrors>({});

  const shops = shopsQuery.data ?? [];
  const products = useMemo(() => catalogueQuery.data ?? [], [catalogueQuery.data]);
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.productId, product])),
    [products],
  );
  const selectedShop = shops.find((shop) => shop.shopId === values.shopId);

  // Display-only estimate. The server recomputes the real total.
  const estimate = values.lines.reduce((sum, line) => {
    const product = productsById.get(line.productId);
    const quantity = Number(line.quantity);
    return product && Number.isInteger(quantity) && quantity > 0
      ? sum + product.currentUnitPrice * quantity
      : sum;
  }, 0);

  const clearErrors = (lineKey?: string) =>
    setErrors((current) => {
      const next: CreateOrderFormErrors = { ...current };
      delete next.form;
      delete next.lines;
      if (lineKey && next.lineErrors) {
        const { [lineKey]: _removed, ...rest } = next.lineErrors;
        if (Object.keys(rest).length > 0) {
          next.lineErrors = rest;
        } else {
          delete next.lineErrors;
        }
      }
      return next;
    });

  const setShop = (shopId: string) => {
    setValues((current) => ({ ...current, shopId }));
    setErrors((current) => {
      const next = { ...current };
      delete next.shopId;
      delete next.form;
      return next;
    });
  };

  const updateLine = (key: string, patch: Partial<Omit<OrderLineFormValues, "key">>) => {
    setValues((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    }));
    clearErrors(key);
  };

  const addLine = () => {
    setValues((current) => ({ ...current, lines: [...current.lines, newLine()] }));
    clearErrors();
  };

  const removeLine = (key: string) => {
    setValues((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.key !== key),
    }));
    clearErrors(key);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateCreateOrder(values);
    if (hasValidationErrors(validationErrors) || !selectedShop) {
      setErrors(validationErrors);
      return;
    }

    try {
      const order = await createMutation.mutateAsync({
        shopId: selectedShop.shopId,
        fulfilmentType: values.fulfilmentType,
        agencyId: selectedShop.agencyId,
        territoryId: selectedShop.territoryId,
        provinceId: selectedShop.provinceId,
        lines: values.lines.map((line) => {
          const product = productsById.get(line.productId);
          return {
            productId: line.productId,
            quantity: Number(line.quantity),
            // PROVISIONAL until US-E4-1b: the server will resolve these itself.
            productName: product?.name ?? "",
            unitPrice: product?.currentUnitPrice ?? 0,
          };
        }),
      });

      if (order.fulfilmentType === "ImmediateCashSale") {
        // The sale is not finished: the rep still has to check in at the shop
        // and take the payment (US-E4-3). Send them to the order, not the list.
        toast.success(
          `Order ${order.orderReference} — ${formatLkr(order.total)}. Take payment at the shop to complete it.`,
        );
        await navigate({ to: "/orders/$orderId", params: { orderId: order.orderId } });
        return;
      }

      toast.success(
        `Order ${order.orderReference} confirmed for ${selectedShop.name} — ${formatLkr(order.total)}.`,
      );

      await navigate({ to: "/orders" });
    } catch (error) {
      const message =
        error instanceof OrderApiError ? error.message : "The order could not be placed.";
      setErrors((current) => ({ ...current, form: message }));
      toast.error(message);
    }
  };

  const loadError = shopsQuery.error ?? catalogueQuery.error;

  return (
    <>
      <PageHeader
        title="New Order"
        description="Record a shop's order with the products and quantities they want."
        crumbs={[{ label: "Orders", to: "/orders" }, { label: "New Order" }]}
      />

      <div className="mx-auto max-w-3xl pb-12">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardPlus className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">Order details</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Only shops in your assigned territory are listed.
              </p>
            </div>
          </div>

          {(errors.form ?? loadError) && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                {errors.form ??
                  (loadError instanceof Error
                    ? loadError.message
                    : "Order data could not be loaded.")}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <FieldLabel htmlFor="shopId" required>
              Shop
            </FieldLabel>
            <select
              id="shopId"
              value={values.shopId}
              disabled={shopsQuery.isLoading}
              aria-invalid={!!errors.shopId}
              onChange={(event) => setShop(event.target.value)}
              className={productInputClass(!!errors.shopId)}
            >
              <option value="">
                {shopsQuery.isLoading ? "Loading your shops…" : "Select a shop"}
              </option>
              {shops.map((shop) => (
                <option key={shop.shopId} value={shop.shopId}>
                  {shop.name} — {shop.address}
                </option>
              ))}
            </select>
            <FieldError message={errors.shopId} />
            {shopsQuery.isSuccess && shops.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No shops are registered in your territory yet. Ask your agency operator to add them.
              </p>
            )}
            {selectedShop && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Store className="size-3.5" />
                {selectedShop.territoryName} · {selectedShop.agencyName}
                {selectedShop.ownerName ? ` · Owner: ${selectedShop.ownerName}` : ""}
              </p>
            )}
          </div>

          <div className="mt-6 space-y-1.5">
            <FieldLabel htmlFor="fulfilmentType" required>
              How is the shop taking this order?
            </FieldLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                {
                  value: "ImmediateCashSale" as const,
                  icon: <Banknote className="size-4" />,
                  title: "Cash sale now",
                  hint: "Paid at the shop, handed over from your van.",
                },
                {
                  value: "ScheduledDelivery" as const,
                  icon: <Truck className="size-4" />,
                  title: "Scheduled delivery",
                  hint: "On credit; the agency delivers later.",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  id={option.value === "ImmediateCashSale" ? "fulfilmentType" : undefined}
                  type="button"
                  aria-pressed={values.fulfilmentType === option.value}
                  onClick={() => {
                    setValues((current) => ({ ...current, fulfilmentType: option.value }));
                    clearErrors();
                  }}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    values.fulfilmentType === option.value
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-muted",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {option.icon}
                    {option.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{option.hint}</span>
                </button>
              ))}
            </div>
            <FieldError message={errors.fulfilmentType} />
            {values.fulfilmentType === "ImmediateCashSale" && (
              <p className="text-xs text-muted-foreground">
                A cash sale can only include products you are carrying in your van.
              </p>
            )}
          </div>

          <div className="mt-7 border-t border-border pt-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Products
              </span>
              <span className="text-xs text-muted-foreground">
                {values.lines.length} / {MAX_ORDER_LINES} lines
              </span>
            </div>

            <div className="space-y-3">
              {values.lines.map((line, index) => {
                const product = productsById.get(line.productId);
                const takenElsewhere = new Set(
                  values.lines
                    .filter((other) => other.key !== line.key && other.productId)
                    .map((other) => other.productId),
                );
                const lineError = errors.lineErrors?.[line.key];

                return (
                  <div key={line.key} className="rounded-lg border border-border p-3">
                    <div className="grid grid-cols-[1fr_6rem_auto] items-end gap-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`product-${line.key}`}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Product {index + 1}
                        </label>
                        <select
                          id={`product-${line.key}`}
                          value={line.productId}
                          disabled={catalogueQuery.isLoading}
                          aria-invalid={!!lineError}
                          onChange={(event) =>
                            updateLine(line.key, { productId: event.target.value })
                          }
                          className={productInputClass(!!lineError)}
                        >
                          <option value="">
                            {catalogueQuery.isLoading ? "Loading products…" : "Select a product"}
                          </option>
                          {products.map((option) => (
                            <option
                              key={option.productId}
                              value={option.productId}
                              disabled={takenElsewhere.has(option.productId)}
                            >
                              {option.name} ({option.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor={`quantity-${line.key}`}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Qty
                        </label>
                        <input
                          id={`quantity-${line.key}`}
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={line.quantity}
                          aria-invalid={!!lineError}
                          onChange={(event) =>
                            updateLine(line.key, { quantity: event.target.value })
                          }
                          className={cn(productInputClass(!!lineError), "font-mono")}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        disabled={values.lines.length === 1}
                        aria-label={`Remove product ${index + 1}`}
                        className="flex h-10 items-center justify-center rounded-lg border border-input px-3 text-muted-foreground hover:text-destructive disabled:opacity-40"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {product && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatLkr(product.currentUnitPrice)} per {product.unitOfMeasure}
                      </p>
                    )}
                    <div className="mt-1">
                      <FieldError message={lineError} />
                    </div>
                  </div>
                );
              })}
            </div>

            <FieldError message={errors.lines} />

            <button
              type="button"
              onClick={addLine}
              disabled={values.lines.length >= MAX_ORDER_LINES}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-input px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              <Plus className="size-4" /> Add product
            </button>
          </div>

          <div className="mt-7 flex items-start gap-3 rounded-lg bg-muted/60 p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated total</span>
                <span className="font-mono font-medium">{formatLkr(estimate)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimate only. The final total is calculated by the server when the order is placed.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => void navigate({ to: "/orders" })}
              className="h-10 rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Send className="size-4" />
              {createMutation.isPending ? "Placing order…" : "Place order"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
