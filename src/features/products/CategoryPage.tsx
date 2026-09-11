import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCategories,
  useCreateCategory,
  useDeactivateCategory,
  useUpdateCategory,
} from "./categories";
import type { ProductCategory } from "./types";

function CategoryDialog({
  category,
  open,
  onOpenChange,
}: Readonly<{
  category?: ProductCategory | undefined;
  open: boolean;
  onOpenChange(open: boolean): void;
}>) {
  const create = useCreateCategory();
  const update = useUpdateCategory(category?.categoryId ?? "");
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setDescription(category?.description ?? "");
      setError("");
    }
  }, [category, open]);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    try {
      if (category)
        await update.mutateAsync({ name: name.trim(), description: description.trim() || null });
      else await create.mutateAsync({ name: name.trim(), description: description.trim() || null });
      toast.success(category ? "Category updated." : "Category created.");
      onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Category could not be saved.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void save(event)} className="space-y-4">
          <label className="block text-sm font-medium">
            Category name
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={4}
              className="mt-1 w-full rounded-md border border-input bg-background p-3"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              Save category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryPage() {
  const { role } = useSelloraAuth();
  const canManage = role === "CompanyAdmin";
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategory>();
  const query = useCategories(status);
  const deactivate = useDeactivateCategory();
  const categories = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        `${item.name} ${item.description ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase().trim()),
      ),
    [query.data, search],
  );
  const close = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditing(undefined);
  };
  const deactivateCategory = async (category: ProductCategory) => {
    if (!window.confirm(`Deactivate ${category.name}? Products will become uncategorised.`)) return;
    try {
      await deactivate.mutateAsync(category.categoryId);
      toast.success(`${category.name} was deactivated.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Category could not be deactivated.");
    }
  };
  return (
    <>
      <PageHeader
        title="Product categories"
        description="Organise your company catalogue into flat product groups."
        crumbs={[{ label: "Product categories" }]}
        actions={
          canManage ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus /> Add category
            </Button>
          ) : undefined
        }
      />
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter categories"
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        {query.isError ? (
          <p className="p-6 text-sm text-destructive">
            {query.error instanceof Error ? query.error.message : "Categories could not be loaded."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Category name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {query.isLoading ? (
                  <tr>
                    <td
                      colSpan={canManage ? 4 : 3}
                      className="p-6 text-center text-muted-foreground"
                    >
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length ? (
                  categories.map((category) => (
                    <tr key={category.categoryId} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{category.name}</td>
                      <td className="max-w-lg px-4 py-3 text-muted-foreground">
                        {category.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={category.status} />
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(category);
                              setDialogOpen(true);
                            }}
                            className="mr-3 font-medium text-primary hover:underline"
                          >
                            Edit
                          </button>
                          {category.status === "Active" && (
                            <button
                              type="button"
                              disabled={deactivate.isPending}
                              onClick={() => void deactivateCategory(category)}
                              className="font-medium text-muted-foreground hover:text-destructive"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={canManage ? 4 : 3}
                      className="p-12 text-center text-muted-foreground"
                    >
                      No categories match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {canManage && <CategoryDialog category={editing} open={dialogOpen} onOpenChange={close} />}
    </>
  );
}
