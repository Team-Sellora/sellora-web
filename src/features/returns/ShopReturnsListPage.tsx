import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { ReturnStatusBadge } from "./components/ReturnStatusBadge";
import { useReturns } from "./hooks";
import type { ReturnRequestSummary } from "./types";

const PAGE_SIZE = 20;

const columns = [
  { key: "returnReference", label: "Return reference" },
  { key: "orderReference", label: "Order reference" },
  { key: "shopName", label: "Shop" },
  { key: "status", label: "Status" },
  { key: "requestedAt", label: "Requested date" },
  { key: "requestedByRole", label: "Requested by" },
];

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "Requested", label: "Requested" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

export function ShopReturnsListPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const statusParam = statusFilter === "all" ? undefined : [statusFilter];
  const query = useReturns({
    page,
    pageSize: PAGE_SIZE,
    status: statusParam,
  });

  const items = query.data?.items ?? [];
  const totalCount = query.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const renderCell = (row: ReturnRequestSummary, key: string): ReactNode => {
    switch (key) {
      case "returnReference":
        return (
          <Link
            to="/returns/$returnId"
            params={{ returnId: row.returnRequestId }}
            className="font-mono text-xs font-semibold text-foreground hover:text-primary hover:underline"
          >
            {row.returnReference}
          </Link>
        );
      case "orderReference":
        return <span className="font-mono text-xs">{row.orderReference}</span>;
      case "shopName":
        return row.shopName;
      case "status":
        return <ReturnStatusBadge status={row.status} />;
      case "requestedAt":
        return new Date(row.requestedAt).toLocaleDateString();
      case "requestedByRole":
        return row.requestedByRole;
      default:
        return String(row[key] ?? "");
    }
  };

  return (
    <>
      <PageHeader
        title="Shop returns"
        description="Track customer shop return requests and stock restoration."
        crumbs={[{ label: "Shop returns" }]}
      />

      {query.isError && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : "Shop returns could not be loaded."}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={items}
        loading={query.isLoading}
        renderCell={renderCell}
        statusFilter={statusFilter}
        onStatusFilter={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        statusOptions={statusOptions}
        serverPagination={{
          page,
          totalPages,
          totalCount,
          onPageChange: setPage,
        }}
        emptyMessage="No shop returns found."
      />
    </>
  );
}
