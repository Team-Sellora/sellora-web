import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, BadgeCheck, PackagePlus, Save, ShieldCheck, Warehouse } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useActiveCategories, useCreateProduct } from "./hooks";
import { FieldError, FieldLabel, ProductCoreFields } from "./ProductCoreFields";
import { productInputClass } from "./productFormStyles";
import { hasValidationErrors, validateCreateProduct } from "./validation";
import {
  ProductApiError,
  type CreateProductFormErrors,
  type CreateProductFormValues,
} from "./types";

const initialValues: CreateProductFormValues = {
  sku: "",
  name: "",
  description: "",
  unitOfMeasure: "",
  currentUnitPrice: "",
  batchCode: "",
  manufacturingDate: "",
  expiryDate: "",
  categoryId: "",
};

export function CreateProductPage() {
  const navigate = useNavigate();
  const { username } = useSelloraAuth();
  const createMutation = useCreateProduct();
  const categoriesQuery = useActiveCategories();

  const [values, setValues] = useState<CreateProductFormValues>(initialValues);

  const [errors, setErrors] = useState<CreateProductFormErrors>({});

  const setValue = (field: keyof CreateProductFormValues, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      const next = { ...current };

      delete next[field];
      delete next.form;

      return next;
    });
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateCreateProduct(values);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    try {
      const product = await createMutation.mutateAsync({
        sku: values.sku.trim(),
        name: values.name.trim(),
        description: values.description.trim() || null,
        unitOfMeasure: values.unitOfMeasure.trim(),
        currentUnitPrice: Number(values.currentUnitPrice),
        batchCode: values.batchCode.trim(),
        manufacturingDate: values.manufacturingDate,
        expiryDate: values.expiryDate,
        categoryId: values.categoryId || null,
      });

      toast.success(`${product.name} was created successfully.`);

      await navigate({
        to: "/products",
      });
    } catch (error) {
      const message =
        error instanceof ProductApiError ? error.message : "The product could not be created.";

      setErrors((current) => ({
        ...current,
        form: message,
      }));

      toast.error(message);
    }
  };

  return (
    <>
      <PageHeader
        title="New Product"
        description="Register a new stock keeping unit in the company sales catalogue."
        crumbs={[
          {
            label: "Products",
            to: "/products",
          },
          {
            label: "New Product",
          },
        ]}
      />

      <div className="relative mx-auto max-w-3xl pb-12">
        <div className="pointer-events-none absolute -top-12 left-1/2 h-36 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackagePlus className="size-5" />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Create catalogue entry</h2>

                <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Draft
                </span>
              </div>

              <p className="mt-0.5 text-sm text-muted-foreground">
                Enter the product and initial batch information.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Company catalogue</span>
            <span className="size-2 rounded-full bg-emerald-500" />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="relative rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-semibold">Catalogue attributes</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                General product data and catalogue validation.
              </p>
            </div>

            <BadgeCheck className="size-5 text-muted-foreground" />
          </div>

          {errors.form && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <ProductCoreFields
            values={values}
            errors={errors}
            onChange={setValue}
            categories={categoriesQuery.data ?? []}
            categoriesLoading={categoriesQuery.isLoading}
          />

          <div className="mt-5 space-y-1.5">
            <FieldLabel htmlFor="currentUnitPrice" required hint="Tax exclusive">
              Unit price
            </FieldLabel>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center rounded-l-lg border-r border-input bg-muted px-3 font-mono text-xs text-muted-foreground">
                LKR
              </span>
              <input
                id="currentUnitPrice"
                name="currentUnitPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={values.currentUnitPrice}
                placeholder="0.00"
                aria-invalid={!!errors.currentUnitPrice}
                onChange={(event) => setValue("currentUnitPrice", event.target.value)}
                className={cn(productInputClass(!!errors.currentUnitPrice), "pl-16 font-mono")}
              />
            </div>
            <FieldError message={errors.currentUnitPrice} />
          </div>

          <div className="mt-7 border-t border-border pt-6">
            <div className="mb-5 flex items-center gap-2">
              <Warehouse className="size-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lot and batch tracking
              </span>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="batchCode" required>
                  Batch code
                </FieldLabel>

                <input
                  id="batchCode"
                  name="batchCode"
                  type="text"
                  value={values.batchCode}
                  maxLength={80}
                  autoComplete="off"
                  placeholder="e.g. BATCH-2026-001"
                  aria-invalid={!!errors.batchCode}
                  onChange={(event) => setValue("batchCode", event.target.value.toUpperCase())}
                  className={cn(productInputClass(!!errors.batchCode), "font-mono")}
                />

                <FieldError message={errors.batchCode} />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FieldLabel htmlFor="manufacturingDate" required>
                    Manufacturing date
                  </FieldLabel>

                  <input
                    id="manufacturingDate"
                    name="manufacturingDate"
                    type="date"
                    value={values.manufacturingDate}
                    aria-invalid={!!errors.manufacturingDate}
                    onChange={(event) => setValue("manufacturingDate", event.target.value)}
                    className={cn(productInputClass(!!errors.manufacturingDate), "font-mono")}
                  />

                  <FieldError message={errors.manufacturingDate} />
                </div>

                <div className="space-y-1.5">
                  <FieldLabel htmlFor="expiryDate" required>
                    Expiry date
                  </FieldLabel>

                  <input
                    id="expiryDate"
                    name="expiryDate"
                    type="date"
                    value={values.expiryDate}
                    min={values.manufacturingDate || undefined}
                    aria-invalid={!!errors.expiryDate}
                    onChange={(event) => setValue("expiryDate", event.target.value)}
                    className={cn(productInputClass(!!errors.expiryDate), "font-mono")}
                  />

                  <FieldError message={errors.expiryDate} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground">
              Required fields are marked with an asterisk.
            </p>

            <div className="flex gap-3">
              <Link
                to="/products"
                className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-input px-4 text-sm font-medium hover:bg-muted sm:flex-none"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                <Save className="size-4" />
                {createMutation.isPending ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </form>

        <div className="mx-auto mt-4 flex max-w-2xl items-center justify-between rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            <span>
              This entry will be associated with your authenticated company
              {username ? ` and recorded by ${username}` : ""}.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
