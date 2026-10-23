import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ApiProblem,
  fetchCompanyAdmins,
  fetchHierarchyRollUp,
  updateAreaManagerReportsTo,
} from "./api";

function errorMessage(error: unknown) {
  if (error instanceof ApiProblem) return error.detail || error.message;
  if (error instanceof Error) return error.message;
  return "Could not update the reporting line. Please try again.";
}

export function HierarchyRollUpPage() {
  const queryClient = useQueryClient();
  const [selectedAdmins, setSelectedAdmins] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const rollUpQuery = useQuery({
    queryKey: ["hierarchy", "roll-up"],
    queryFn: fetchHierarchyRollUp,
  });
  const adminsQuery = useQuery({ queryKey: ["company-admins"], queryFn: fetchCompanyAdmins });

  const updateMutation = useMutation({
    mutationFn: ({
      provinceId,
      reportsToAdminId,
    }: {
      provinceId: string;
      reportsToAdminId: string;
    }) => updateAreaManagerReportsTo(provinceId, reportsToAdminId),
    onSuccess: async (_, variables) => {
      setRowErrors((errors) => {
        const { [variables.provinceId]: _, ...remaining } = errors;
        return remaining;
      });
      await queryClient.invalidateQueries({ queryKey: ["hierarchy", "roll-up"] });
    },
    onError: (error, variables) => {
      setRowErrors((errors) => ({ ...errors, [variables.provinceId]: errorMessage(error) }));
    },
  });

  if (rollUpQuery.isLoading || adminsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading hierarchy roll-up…</p>;
  }

  if (rollUpQuery.isError || adminsQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {errorMessage(rollUpQuery.error ?? adminsQuery.error)}
      </p>
    );
  }

  const provinces = rollUpQuery.data;
  const admins = adminsQuery.data;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Hierarchy roll-up"
        description="Company-wide province coverage, structure, and reporting lines."
        crumbs={[{ label: "Hierarchy roll-up" }]}
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Province</th>
              <th className="px-4 py-3">Area Manager</th>
              <th className="px-4 py-3">Reports to</th>
              <th className="px-4 py-3 text-right">Agencies</th>
              <th className="px-4 py-3 text-right">Territories</th>
              <th className="px-4 py-3 text-right">Shops</th>
              <th className="px-4 py-3">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {provinces.map((province) => {
              const currentAdminId = province.currentManager?.reportsToAdmin?.staffProfileId ?? "";
              const selectedAdminId = selectedAdmins[province.provinceId] ?? currentAdminId;
              const isUpdating =
                updateMutation.isPending &&
                updateMutation.variables?.provinceId === province.provinceId;

              return (
                <tr
                  key={province.provinceId}
                  className={
                    province.hasUnassignedTerritories
                      ? "border-b border-amber-200 bg-amber-50/60 last:border-0"
                      : "border-b border-border last:border-0"
                  }
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{province.name}</div>
                    <div className="text-xs text-muted-foreground">{province.code}</div>
                  </td>
                  <td className="px-4 py-3">
                    {province.currentManager ? (
                      <>
                        <div>{province.currentManager.displayName}</div>
                        {province.currentManager.email && (
                          <div className="text-xs text-muted-foreground">
                            {province.currentManager.email}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">No active manager</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {province.currentManager ? (
                      <div className="space-y-1.5">
                        <label className="sr-only" htmlFor={`reports-to-${province.provinceId}`}>
                          Reporting admin for {province.name}
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            id={`reports-to-${province.provinceId}`}
                            className="h-9 min-w-48 rounded-md border border-input bg-background px-3 text-sm"
                            value={selectedAdminId}
                            disabled={isUpdating}
                            onChange={(event) => {
                              setSelectedAdmins((selected) => ({
                                ...selected,
                                [province.provinceId]: event.target.value,
                              }));
                              setRowErrors((errors) => {
                                const { [province.provinceId]: _, ...remaining } = errors;
                                return remaining;
                              });
                            }}
                          >
                            <option value="">Select a Company Admin</option>
                            {admins.map((admin) => (
                              <option key={admin.staffProfileId} value={admin.staffProfileId}>
                                {admin.displayName}
                                {admin.email ? ` (${admin.email})` : ""}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              !selectedAdminId || selectedAdminId === currentAdminId || isUpdating
                            }
                            onClick={() =>
                              updateMutation.mutate({
                                provinceId: province.provinceId,
                                reportsToAdminId: selectedAdminId,
                              })
                            }
                          >
                            {isUpdating ? "Saving…" : "Save"}
                          </Button>
                        </div>
                        {rowErrors[province.provinceId] && (
                          <p className="text-xs text-destructive" role="alert">
                            {rowErrors[province.provinceId]}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{province.agencyCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{province.territoryCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{province.shopCount}</td>
                  <td className="px-4 py-3">
                    {province.hasUnassignedTerritories ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
                        <AlertTriangle className="size-3.5" aria-hidden="true" />
                        {province.unassignedTerritoryCount} unassigned
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-700">Fully assigned</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {provinces.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No provinces found.
          </p>
        )}
      </div>
    </section>
  );
}
