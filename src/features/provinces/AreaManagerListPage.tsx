import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { Status } from "@/lib/mock-data";
import { useAreaManagers } from "./hooks";
import { OverviewCards } from "@/components/OverviewCards";

export function AreaManagerListPage() {
  const { data, isPending, isError, error } = useAreaManagers();

  return (
    <>
      <PageHeader
        title="Area Managers"
        description="Directory of regional personnel overseeing provincial sales teams and agency networks."
        crumbs={[{ label: "Area Managers" }]}
      />

      <OverviewCards
        items={[
          {
            label: "Active Managers",
            value: data?.filter((manager) => manager.status === "Active").length,
          },
          { label: "Directory Records", value: data?.length },
          { label: "Email Contacts", value: data?.filter((manager) => manager.email).length },
          {
            label: "Inactive Managers",
            value: data?.filter((manager) => manager.status !== "Active").length,
          },
        ]}
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
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className="person-avatar">
                        {manager.displayName
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      {manager.displayName}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {manager.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={manager.status as Status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {data && <div className="table-caption">Showing {data.length} Area Managers</div>}
      </div>
    </>
  );
}
