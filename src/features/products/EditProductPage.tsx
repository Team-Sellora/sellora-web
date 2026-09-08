import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CircleAlert, Info, Pencil, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { useProduct, useUpdateProduct } from "./hooks";
import { ProductCoreFields } from "./ProductCoreFields";
import { hasValidationErrors, validateUpdateProduct } from "./validation";
import {
  ProductApiError,
  type UpdateProductFormErrors,
  type UpdateProductFormValues,
} from "./types";

interface EditProductPageProps {
  productId: string;
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

          <ProductCoreFields values={values} errors={errors} onChange={setValue} editing />

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
