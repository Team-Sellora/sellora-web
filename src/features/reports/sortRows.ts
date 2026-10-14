import type { BreakdownRow, SortDirection } from "./types";

export type BreakdownSortColumn = "name" | "salesValue" | "orderCount" | "averageOrderValue";

export function sortRows(
  rows: readonly BreakdownRow[],
  column: BreakdownSortColumn,
  direction: SortDirection,
): BreakdownRow[] {
  const indexed = rows.map((row, index) => ({ row, index }));

  indexed.sort((a, b) => {
    let cmp = 0;

    if (column === "name") {
      cmp = a.row.name.localeCompare(b.row.name);
    } else {
      const numA = a.row[column];
      const numB = b.row[column];
      cmp = numA - numB;
    }

    if (direction === "desc") {
      cmp = -cmp;
    }

    // Preserve original order on ties
    return cmp !== 0 ? cmp : a.index - b.index;
  });

  return indexed.map((item) => item.row);
}
