import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ApiProblem,
  assignTerritoryToAgency,
  fetchAgencies,
  fetchUnassignedTerritories,
} from "./api";
import { agenciesForProvince } from "./territoryAssignments";

function errorMessage(error: unknown) {
  if (error instanceof ApiProblem) return error.detail || error.message;
  if (error instanceof Error) return error.message;
  return "Unable to assign the territory. Please try again.";
}

export function TerritoryAssignmentPage() {
  const queryClient = useQueryClient();
  const [selectedAgencies, setSelectedAgencies] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const territoriesQuery = useQuery({
    queryKey: ["territories", "unassigned"],
    queryFn: fetchUnassignedTerritories,
  });
  const agenciesQuery = useQuery({ queryKey: ["agencies"], queryFn: fetchAgencies });

  const assignMutation = useMutation({
    mutationFn: ({ territoryId, agencyId }: { territoryId: string; agencyId: string }) =>
      assignTerritoryToAgency(territoryId, agencyId),
    onSuccess: async (_, variables) => {
      setRowErrors((errors) => {
        const { [variables.territoryId]: _, ...remainingErrors } = errors;
        return remainingErrors;
      });
      setSelectedAgencies((selected) => {
        const { [variables.territoryId]: _, ...remainingSelections } = selected;
        return remainingSelections;
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["territories", "unassigned"] }),
        queryClient.invalidateQueries({ queryKey: ["territories"] }),
      ]);
    },
    onError: (error, variables) => {
      setRowErrors((errors) => ({
        ...errors,
        [variables.territoryId]: errorMessage(error),
      }));
    },
  });

  if (territoriesQuery.isLoading || agenciesQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading territory assignments…</p>;
  }

  if (territoriesQuery.isError || agenciesQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {errorMessage(territoriesQuery.error ?? agenciesQuery.error)}
      </p>
    );
  }

  const territories = territoriesQuery.data.items;
  const agencies = agenciesQuery.data.items;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assign territories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {territories.length === 0
            ? "All available territories have an active agency assignment."
            : `${territories.length} unassigned ${territories.length === 1 ? "territory needs" : "territories need"} an agency.`}
        </p>
      </div>

      {territories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No unassigned territories found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Territory</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Assignment status</th>
                <th className="px-4 py-3 font-medium">Agency</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {territories.map((territory) => {
                const provinceAgencies = agenciesForProvince(agencies, territory.provinceId);
                const selectedAgencyId = selectedAgencies[territory.territoryId] ?? "";
                const isSubmitting =
                  assignMutation.isPending &&
                  assignMutation.variables?.territoryId === territory.territoryId;

                return (
                  <tr key={territory.territoryId} className="border-t align-top">
                    <td className="px-4 py-3 font-medium">{territory.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{territory.code}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                        Unassigned
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Agency for ${territory.name}`}
                        className="h-9 min-w-52 rounded-md border bg-background px-3 text-sm"
                        value={selectedAgencyId}
                        disabled={isSubmitting || provinceAgencies.length === 0}
                        onChange={(event) => {
                          setSelectedAgencies((selected) => ({
                            ...selected,
                            [territory.territoryId]: event.target.value,
                          }));
                          setRowErrors((errors) => {
                            const { [territory.territoryId]: _, ...remainingErrors } = errors;
                            return remainingErrors;
                          });
                        }}
                      >
                        <option value="">
                          {provinceAgencies.length === 0
                            ? "No agencies in this province"
                            : "Select an agency"}
                        </option>
                        {provinceAgencies.map((agency) => (
                          <option key={agency.agencyId} value={agency.agencyId}>
                            {agency.name}
                          </option>
                        ))}
                      </select>
                      {rowErrors[territory.territoryId] && (
                        <p className="mt-1 max-w-xs text-xs text-destructive" role="alert">
                          {rowErrors[territory.territoryId]}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!selectedAgencyId || isSubmitting}
                        onClick={() =>
                          assignMutation.mutate({
                            territoryId: territory.territoryId,
                            agencyId: selectedAgencyId,
                          })
                        }
                      >
                        {isSubmitting ? "Assigning…" : "Assign"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
