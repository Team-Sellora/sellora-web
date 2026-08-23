import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getEntity, type Record_, type Status } from "@/lib/mock-data";

function EntityRowActions({
  slug,
  row,
}: Readonly<{ slug: string; row: { id: string; status: string } }>) {
  return (
    <div className="flex justify-end gap-3 text-xs">
      <Link
        to="/records/$entity/$id"
        params={{ entity: slug, id: row.id }}
        className="text-primary hover:underline"
      >
        Edit
      </Link>
      <button type="button" className="text-muted-foreground hover:text-destructive">
        {row.status === "Active" ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}

function createEntityRowActions(slug: string) {
  return (row: Record_) => <EntityRowActions slug={slug} row={row} />;
}

export function EntityListPage({ slug }: Readonly<{ slug: string }>) {
  const entity = getEntity(slug)!;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  // Replace with a query against the real API later.
  const [loading] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entity.rows.filter((row) => {
      const matchesStatus = status === "all" || row.status === status;
      const matchesSearch =
        !q ||
        Object.entries(row).some(([k, v]) => k !== "id" && String(v).toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [entity.rows, search, status]);

  return (
    <>
      <PageHeader
        title={entity.title}
        description={`Manage ${entity.title.toLowerCase()} across the distribution network.`}
        crumbs={[{ label: entity.title }]}
        actions={
          <Link
            to="/records/$entity/$id"
            params={{ entity: entity.slug, id: "new" }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Add New
          </Link>
        }
      />

      <DataTable
        columns={entity.columns}
        rows={rows}
        loading={loading}
        searchValue={search}
        onSearch={setSearch}
        statusFilter={status}
        onStatusFilter={setStatus}
        renderCell={(row, key) =>
          key === "status" ? <StatusBadge status={row.status as Status} /> : row[key]
        }
        rowActions={createEntityRowActions(entity.slug)}
      />
    </>
  );
}
