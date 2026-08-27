import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { Status } from "@/lib/mock-data";
import { useAreaManagers } from "./hooks";

export function AreaManagerListPage() {
  const { data, isPending, isError, error } = useAreaManagers();

  return (
    <>
      <PageHeader
        title="Area Managers"
        description="Active Area Managers in your company."
        crumbs={[{ label: "Area Managers" }]}
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isPending &&
              Array.from({ length: 3 }).map((_, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  {Array.from({ length: 3 }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}

            {isError && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-destructive">
                  Couldn&apos;t load Area Managers: {error.message}
                </td>
              </tr>
            )}

            {!isPending && !isError && data?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No active Area Managers yet.
                </td>
              </tr>
            )}

            {!isPending &&
              !isError &&
              data?.map((manager) => (
                <tr
                  key={manager.staffProfileId}
                  className="border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium">{manager.displayName}</td>
                  <td className="px-4 py-3">{manager.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={manager.status as Status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
