import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Status } from "@/lib/mock-data";
import { useProvinces } from "./hooks";
import { ReassignManagerDialog } from "./ReassignManagerDialog";
import type { Province } from "./types";

export function ProvinceListPage() {
  const { data, isPending, isError, error } = useProvinces();
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);

  return (
    <>
      <PageHeader
        title="Provinces"
        description="Provinces in your company, their current Area Manager, and size at a glance."
        crumbs={[{ label: "Provinces" }]}
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Province</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Current Manager</th>
              <th className="px-4 py-3 text-right">Agencies</th>
              <th className="px-4 py-3 text-right">Shops</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isPending &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}

            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-destructive">
                  Couldn't load provinces: {error.message}
                </td>
              </tr>
            )}

            {!isPending && !isError && data && data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No provinces yet.
                </td>
              </tr>
            )}

            {!isPending &&
              !isError &&
              data?.map((p) => (
                <tr
                  key={p.provinceId}
                  className="border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status as Status} />
                  </td>
                  <td className="px-4 py-3">
                    {p.currentManager ? (
                      <div>
                        <div>{p.currentManager.displayName}</div>
                        {p.currentManager.email && (
                          <div className="text-xs text-muted-foreground">
                            {p.currentManager.email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.agencyCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.shopCount}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant={p.currentManager ? "outline" : "default"}
                      onClick={() => setSelectedProvince(p)}
                    >
                      {p.currentManager ? "Change" : "Assign"}
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <ReassignManagerDialog
        open={selectedProvince !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProvince(null);
        }}
        province={selectedProvince}
      />
    </>
  );
}
