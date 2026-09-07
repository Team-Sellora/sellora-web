import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Info,
  Package,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useDeactivateProduct, useProducts } from "./hooks";
import type { Product } from "./types";

const PAGE_SIZE = 10;

function formatPrice(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(value);
}

function nearestExpiry(product: Product): string | null {
  const dates = product.batches
    .map((batch) => batch.expiryDate)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  return dates[0] ?? null;
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
}: Readonly<{ label: string; value: string | number; detail: string; icon: React.ReactNode }>) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className="text-right text-xs text-muted-foreground">{detail}</span>
      </div>
    </div>
  );
}

export function ProductPage() {
  const { role } = useSelloraAuth();
  const canManage = role === "CompanyAdmin";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Active");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const productsQuery = useProducts({ search, status, page, pageSize: PAGE_SIZE });
  const deactivateMutation = useDeactivateProduct();
  const products = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data?.items]);

  const visibleProducts = products;

  const activeCount = products.filter((product) => product.status === "Active").length;
  const inactiveCount = products.filter((product) => product.status === "Inactive").length;
  const ninetyDaysFromNow = Date.now() + 90 * 24 * 60 * 60 * 1000;
  const expiringCount = products.filter((product) => {
    const expiry = nearestExpiry(product);
    if (!expiry) return false;
    const expiryTime = new Date(expiry).getTime();
    return expiryTime >= Date.now() && expiryTime <= ninetyDaysFromNow;
  }).length;

  const handleDeactivate = async (product: Product) => {
    if (
      !window.confirm(`Deactivate ${product.name}? The product will remain in historical records.`)
    ) {
      return;
    }

    try {
      await deactivateMutation.mutateAsync(product.productId);
      toast.success(`${product.name} was deactivated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Product deactivation failed.");
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage the product catalogue for your company."
        crumbs={[{ label: "Products" }]}
        actions={
          canManage ? (
            <Link
              to="/products/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Add Product
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total products"
          value={productsQuery.data?.totalCount ?? 0}
          detail="Matching this search"
          icon={<Package className="size-5" />}
        />
        <SummaryCard
          label="Operational status"
          value={activeCount}
          detail={`${inactiveCount} inactive on this page`}
          icon={<CircleCheck className="size-5" />}
        />
        <SummaryCard
          label="Expiring in 90 days"
          value={expiringCount}
          detail="On this page"
          icon={<CalendarClock className="size-5" />}
        />
        <SummaryCard
          label="Page coverage"
          value={products.length}
          detail={`Up to ${PAGE_SIZE} per page`}
          icon={<Search className="size-5" />}
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name or SKU"
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setStatus("Active");
                setPage(1);
              }}
              className="h-9 rounded-md bg-muted px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            {productsQuery.data?.totalCount ?? 0} matching product
            {(productsQuery.data?.totalCount ?? 0) === 1 ? "" : "s"}
          </span>
        </div>

        {productsQuery.isError && (
          <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {productsQuery.error instanceof Error
              ? productsQuery.error.message
              : "Products could not be loaded."}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Product name</th>
                <th className="px-4 py-3 font-semibold">UoM</th>
                <th className="px-4 py-3 text-right font-semibold">Unit price</th>
                <th className="px-4 py-3 font-semibold">Next expiry</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {canManage && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productsQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={canManage ? 7 : 6} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : visibleProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 7 : 6}
                    className="px-4 py-14 text-center text-muted-foreground"
                  >
                    No products match the current filters.
                  </td>
                </tr>
              ) : (
                visibleProducts.map((product) => {
                  const expiry = nearestExpiry(product);
                  return (
                    <tr key={product.productId} className="hover:bg-muted/40">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {product.unitOfMeasure}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-medium">
                        {formatPrice(product.currentUnitPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                        {expiry ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={product.status as "Active" | "Inactive"} />
                      </td>
                      {canManage && (
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                          <Link
                            to="/records/$entity/$id"
                            params={{ entity: "products", id: product.productId }}
                            className="mr-3 font-medium text-primary hover:underline"
                          >
                            Edit
                          </Link>
                          {product.status === "Active" && (
                            <button
                              type="button"
                              disabled={deactivateMutation.isPending}
                              onClick={() => void handleDeactivate(product)}
                              className="font-medium text-muted-foreground hover:text-destructive disabled:opacity-50"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            Page {productsQuery.data?.page ?? page} of{" "}
            {Math.max(1, productsQuery.data?.totalPages ?? 1)}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || productsQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-3 disabled:opacity-50"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>
            <button
              type="button"
              disabled={
                page >= Math.max(1, productsQuery.data?.totalPages ?? 1) || productsQuery.isFetching
              }
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-3 disabled:opacity-50"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <div className="font-semibold text-foreground">
            Audit and referential integrity policy
          </div>
          <p className="mt-1">
            Products can be deactivated but never deleted. Historical orders retain their product
            references.
          </p>
        </div>
      </div>
    </>
  );
}
