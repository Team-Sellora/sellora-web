import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Column, Record_ } from "@/lib/mock-data";

const PAGE_SIZE = 5;

function SortIcon({
  columnKey,
  sort,
}: Readonly<{ columnKey: string; sort: { key: string; dir: "asc" | "desc" } | null }>) {
  if (sort?.key !== columnKey) return <ArrowUpDown className="size-3" />;
  if (sort.dir === "asc") return <ArrowUp className="size-3" />;
  return <ArrowDown className="size-3" />;
}

export function DataTable({
  columns,
  rows,
  loading = false,
  renderCell,
  rowActions,
  searchValue,
  onSearch,
  statusFilter,
  onStatusFilter,
}: Readonly<{
  columns: Column[];
  rows: Record_[];
  loading?: boolean;
  renderCell?: (row: Record_, key: string) => ReactNode;
  rowActions?: (row: Record_) => ReactNode;
  searchValue: string;
  onSearch: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
}>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const cmp = String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? ""), undefined, {
        numeric: true,
      });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  let tableContent: ReactNode;

  if (loading) {
    tableContent = Array.from({ length: 3 }).map((_, i) => (
      <tr key={i} className="border-b border-border last:border-0">
        {columns.map((col) => (
          <td key={col.key} className="px-4 py-3">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </td>
        ))}
        {rowActions && <td className="px-4 py-3" />}
      </tr>
    ));
  } else if (pageRows.length === 0) {
    tableContent = (
      <tr>
        <td
          colSpan={columns.length + (rowActions ? 1 : 0)}
          className="px-4 py-12 text-center text-sm text-muted-foreground"
        >
          No records found
        </td>
      </tr>
    );
  } else {
    tableContent = pageRows.map((row) => (
      <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/40">
        {columns.map((col) => (
          <td key={col.key} className="px-4 py-3">
            {renderCell ? renderCell(row, col.key) : row[col.key]}
          </td>
        ))}
        {rowActions && <td className="px-4 py-3 text-right">{rowActions(row)}</td>}
      </tr>
    ));
  }

  const toggleSort = (key: string) =>
    setSort((s) =>
      s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <input
          value={searchValue}
          onChange={(e) => {
            onSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search…"
          className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            onStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {sorted.length} record{sorted.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2.5 font-medium text-muted-foreground">
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.label}
                      <SortIcon columnKey={col.key} sort={sort} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {rowActions && (
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>{tableContent}</tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
        <span className="text-xs text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            className={cn(
              "rounded-md border border-input px-3 py-1.5 text-xs",
              currentPage <= 1 ? "text-muted-foreground opacity-60" : "hover:bg-muted",
            )}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
            className={cn(
              "rounded-md border border-input px-3 py-1.5 text-xs",
              currentPage >= totalPages ? "text-muted-foreground opacity-60" : "hover:bg-muted",
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
