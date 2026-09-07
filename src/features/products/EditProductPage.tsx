import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CircleAlert, Info, Pencil, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useProduct, useUpdateProduct } from "./hooks";
import { hasValidationErrors, validateUpdateProduct } from "./validation";
import {
  ProductApiError,
  type UpdateProductFormErrors,
  type UpdateProductFormValues,
} from "./types";

interface EditProductPageProps {
  productId: string;
}

interface FieldErrorProps {
  message: string | undefined;
}

function FieldError({ message }: Readonly<FieldErrorProps>) {
  if (!message) {
    return null;
  }

  return (
    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
      <AlertCircle className="size-3.5" />
      {message}
    </p>
  );
}

interface FieldLabelProps {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}

function FieldLabel({ htmlFor, children, required = false, hint }: Readonly<FieldLabelProps>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {children}

        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      {hint && (
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}

export function EditProductPage({ productId }: Readonly<EditProductPageProps>) {
  const navigate = useNavigate();
  const productQuery = useProduct(productId);
  const updateMutation = useUpdateProduct(productId);

  const [values, setValues] = useState<UpdateProductFormValues | null>(null);

  const [errors, setErrors] = useState<UpdateProductFormErrors>({});

  useEffect(() => {
    if (!productQuery.data || values !== null) {
      return;
    }

    setValues({
      sku: productQuery.data.sku,
      name: productQuery.data.name,
      description: productQuery.data.description ?? "",
      unitOfMeasure: productQuery.data.unitOfMeasure,
    });
  }, [productQuery.data, values]);

  const setValue = (field: keyof UpdateProductFormValues, value: string) => {
    setValues((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });

    setErrors((current) => {
      const next = { ...current };

      delete next[field];
      delete next.form;

      return next;
    });
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values) {
      return;
    }

    const validationErrors = validateUpdateProduct(values);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    try {
      const product = await updateMutation.mutateAsync({
        sku: values.sku.trim(),
        name: values.name.trim(),
        description: values.description.trim() || null,
        unitOfMeasure: values.unitOfMeasure.trim(),
      });

      toast.success(`${product.name} was updated successfully.`);

      await navigate({
        to: "/products/$productId",
        params: {
          productId: product.productId,
        },
      });
    } catch (error) {
      const message =
        error instanceof ProductApiError ? error.message : "The product could not be updated.";

      setErrors((current) => ({
        ...current,
        form: message,
      }));

      toast.error(message);
    }
  };

  const inputClass = (hasError: boolean) =>
    cn(
      "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40",
      hasError ? "border-destructive text-destructive" : "border-input focus:border-ring",
    );

  if (productQuery.isLoading || values === null) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-[500px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (productQuery.isError) {
    const isNotFound =
      productQuery.error instanceof ProductApiError && productQuery.error.status === 404;

    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <CircleAlert className="size-6" />
        </span>

        <h1 className="mt-4 text-xl font-semibold">
          {isNotFound ? "Product not found" : "Product could not be loaded"}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {productQuery.error instanceof Error
            ? productQuery.error.message
            : "An unexpected error occurred."}
        </p>

        <Link
          to="/products"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Return to Products
        </Link>
      </div>
    );
  }

  const product = productQuery.data;

  if (!product) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={`Edit ${product.name}`}
        description="Update the product catalogue information."
        crumbs={[
          {
            label: "Products",
            to: "/products",
          },
          {
            label: product.name,
            to: `/products/${productId}`,
          },
          {
            label: "Edit",
          },
        ]}
      />

      <div className="relative mx-auto max-w-3xl pb-12">
        <div className="pointer-events-none absolute -top-12 left-1/2 h-36 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Pencil className="size-5" />
          </span>

          <div>
            <h2 className="font-semibold">Edit catalogue entry</h2>

            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{product.sku}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="relative rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-semibold">Product attributes</h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Update general product catalogue information.
              </p>
            </div>

            <ShieldCheck className="size-5 text-muted-foreground" />
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

          <div className="space-y-5">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="sku" required hint="Unique key">
                SKU
              </FieldLabel>

              <input
                id="sku"
                name="sku"
                type="text"
                value={values.sku}
                maxLength={80}
                autoComplete="off"
                aria-invalid={!!errors.sku}
                onChange={(event) => setValue("sku", event.target.value.toUpperCase())}
                className={cn(inputClass(!!errors.sku), "font-mono")}
              />

              <FieldError message={errors.sku} />

              {!errors.sku && (
                <p className="text-xs text-muted-foreground">
                  The SKU must remain unique within your company.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="name" required>
                Product name
              </FieldLabel>

              <input
                id="name"
                name="name"
                type="text"
                value={values.name}
                maxLength={200}
                aria-invalid={!!errors.name}
                onChange={(event) => setValue("name", event.target.value)}
                className={inputClass(!!errors.name)}
              />

              <FieldError message={errors.name} />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="description" hint={`${values.description.length}/1000`}>
                Description
              </FieldLabel>

              <textarea
                id="description"
                name="description"
                rows={4}
                value={values.description}
                maxLength={1000}
                aria-invalid={!!errors.description}
                onChange={(event) => setValue("description", event.target.value)}
                className={cn(
                  "w-full resize-y rounded-lg border bg-background p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40",
                  errors.description ? "border-destructive" : "border-input focus:border-ring",
                )}
              />

              <FieldError message={errors.description} />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="unitOfMeasure" required>
                Unit of measure
              </FieldLabel>

              <select
                id="unitOfMeasure"
                name="unitOfMeasure"
                value={values.unitOfMeasure}
                aria-invalid={!!errors.unitOfMeasure}
                onChange={(event) => setValue("unitOfMeasure", event.target.value)}
                className={inputClass(!!errors.unitOfMeasure)}
              >
                <option value="">Select a unit</option>
                <option value="Bottle">Bottle</option>
                <option value="Can">Can</option>
                <option value="Case">Case</option>
                <option value="Pack">Pack</option>
                <option value="Piece">Piece</option>
                <option value="Box">Box</option>
                <option value="Kg">Kilogram</option>
                <option value="Litre">Litre</option>

                {!["", "Bottle", "Can", "Case", "Pack", "Piece", "Box", "Kg", "Litre"].includes(
                  values.unitOfMeasure,
                ) && <option value={values.unitOfMeasure}>{values.unitOfMeasure}</option>}
              </select>

              <FieldError message={errors.unitOfMeasure} />
            </div>
          </div>

          <div className="mt-7 flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-semibold">Controlled product fields</p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Price changes require a separate audited operation. Batch dates and status are also
                not changed through this form.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground">
              Last updated values will be visible immediately.
            </p>

            <div className="flex gap-3">
              <Link
                to="/products/$productId"
                params={{
                  productId,
                }}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-input px-4 text-sm font-medium hover:bg-muted sm:flex-none"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                <Save className="size-4" />

                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
