import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CircleAlert,
  History,
  Info,
  Package,
  Pencil,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useProduct } from "./hooks";
import { ProductApiError, type ProductBatch } from "./types";

interface ProductDetailsPageProps {
  productId: string;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(`${value.substring(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function daysUntil(value: string): number {
  const expiry = new Date(`${value.substring(0, 10)}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function BatchCard({ batch }: Readonly<{ batch: ProductBatch }>) {
  const remainingDays = daysUntil(batch.expiryDate);

  let expiryMessage = `${remainingDays} days remaining`;

  if (remainingDays === 0) {
    expiryMessage = "Expires today";
  } else if (remainingDays < 0) {
    expiryMessage = `Expired ${Math.abs(remainingDays)} days ago`;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Batch code
          </p>

          <p className="mt-1 font-mono text-sm font-medium">{batch.batchCode}</p>
        </div>

        <StatusBadge status={batch.status as "Active" | "Inactive"} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Manufacturing date
          </p>

          <p className="mt-1 text-sm font-medium">{formatDate(batch.manufacturingDate)}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Expiry date
          </p>

          <p className="mt-1 text-sm font-medium">{formatDate(batch.expiryDate)}</p>

          <p
            className={
              remainingDays < 0
                ? "mt-1 text-xs text-destructive"
                : "mt-1 text-xs text-muted-foreground"
            }
          >
            {expiryMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailsPage({ productId }: Readonly<ProductDetailsPageProps>) {
  const { role } = useSelloraAuth();
  const productQuery = useProduct(productId);
  const canManage = role === "CompanyAdmin";

  if (productQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-lg bg-muted" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-xl bg-muted lg:col-span-8" />
          <div className="h-80 animate-pulse rounded-xl bg-muted lg:col-span-4" />
        </div>
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
        title={product.name}
        description={`${product.sku} · Company catalogue product`}
        crumbs={[
          {
            label: "Products",
            to: "/products",
          },
          {
            label: product.name,
          },
        ]}
        actions={
          canManage ? (
            <Link
              to="/products/$productId/edit"
              params={{ productId: product.productId }}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              <Pencil className="size-4" />
              Edit
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={product.status as "Active" | "Inactive"} />

        <span className="font-mono text-xs text-muted-foreground">
          Product ID: {product.productId}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Package className="size-5 text-primary" />

                <h2 className="font-semibold">Product specifications</h2>
              </div>

              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                FMCG master record
              </span>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  SKU
                </p>

                <p className="mt-1 font-mono text-sm font-medium">{product.sku}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Unit of measure
                </p>

                <p className="mt-1 text-sm font-medium">{product.unitOfMeasure}</p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Current unit price
                  </p>

                  <span className="text-xs text-muted-foreground">
                    Authoritative catalogue price
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight">
                    {formatPrice(product.currentUnitPrice)}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    per {product.unitOfMeasure.toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {product.description || "No description has been provided."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Tag className="size-5 text-primary" />

                <h2 className="font-semibold">Batch information</h2>
              </div>

              <span className="text-xs text-muted-foreground">
                {product.batches.length} batch
                {product.batches.length === 1 ? "" : "es"}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {product.batches.length === 0 ? (
                <div className="rounded-lg bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                  No batches are associated with this product.
                </div>
              ) : (
                product.batches.map((batch) => <BatchCard key={batch.batchId} batch={batch} />)
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-border p-6 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <History className="size-5 text-primary" />

                  <h2 className="font-semibold">Price history</h2>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Every accepted price change will be permanently recorded.
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-1 rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Immutable audit log
              </span>
            </div>

            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <History className="size-9 text-muted-foreground/50" />

              <h3 className="mt-3 text-sm font-semibold">Price history is not available yet</h3>

              <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                Audited price changes and their history endpoint will be introduced under US-E2-2.
                The current price shown above is supplied by the Catalog service.
              </p>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-4">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted/60">
              <Package className="size-20 text-muted-foreground/30" />
            </div>

            <div className="mt-4">
              <h2 className="font-semibold">{product.name}</h2>

              <p className="mt-1 font-mono text-xs text-muted-foreground">{product.sku}</p>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />

              <h2 className="font-semibold">Record information</h2>
            </div>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Created
                </dt>

                <dd className="mt-1 text-sm">{formatTimestamp(product.createdAt)}</dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Last updated
                </dt>

                <dd className="mt-1 text-sm">
                  {product.updatedAt ? formatTimestamp(product.updatedAt) : "Not updated yet"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Operational status
                </dt>

                <dd className="mt-2">
                  <StatusBadge status={product.status as "Active" | "Inactive"} />
                </dd>
              </div>
            </dl>
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-semibold">Historical integrity</p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                This product can be deactivated but cannot be permanently deleted because orders may
                retain its identifier.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
