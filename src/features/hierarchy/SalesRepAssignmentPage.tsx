import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ApiProblem,
  assignSalesRepToTerritory,
  fetchSalesReps,
  fetchUnassignedRepTerritories,
} from "./api";

function errorMessage(error: unknown) {
  if (error instanceof ApiProblem) return error.detail || error.message;
  if (error instanceof Error) return error.message;
  return "Unable to assign the Sales Rep. Please try again.";
}

export function SalesRepAssignmentPage() {
  const queryClient = useQueryClient();
  const [selectedTerritories, setSelectedTerritories] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const salesRepsQuery = useQuery({
    queryKey: ["sales-reps"],
    queryFn: fetchSalesReps,
  });
  const territoriesQuery = useQuery({
    queryKey: ["sales-reps", "unassigned-territories"],
    queryFn: fetchUnassignedRepTerritories,
  });

  const assignMutation = useMutation({
    mutationFn: ({ territoryId, salesRepId }: { territoryId: string; salesRepId: string }) =>
      assignSalesRepToTerritory(territoryId, salesRepId),
    onSuccess: async (_, variables) => {
      setRowErrors((errors) => {
        const { [variables.salesRepId]: _, ...remainingErrors } = errors;
        return remainingErrors;
      });
      setSelectedTerritories((selected) => {
        const { [variables.salesRepId]: _, ...remainingSelections } = selected;
        return remainingSelections;
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-reps"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-reps", "unassigned-territories"] }),
      ]);
    },
    onError: (error, variables) => {
      setRowErrors((errors) => ({
        ...errors,
        [variables.salesRepId]: errorMessage(error),
      }));
    },
  });

  if (salesRepsQuery.isLoading || territoriesQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading Sales Reps…</p>;
  }

  if (salesRepsQuery.isError || territoriesQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {errorMessage(salesRepsQuery.error ?? territoriesQuery.error)}
      </p>
    );
  }

  const salesReps = salesRepsQuery.data;
  const unassignedTerritories = territoriesQuery.data;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales Reps</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign Sales Reps to one of your unassigned territories.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Sales Rep</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Current territory</th>
              <th className="px-4 py-3 font-medium">Assign territory</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {salesReps.map((salesRep) => {
              const selectedTerritoryId = selectedTerritories[salesRep.salesRepId] ?? "";
              const isSubmitting =
                assignMutation.isPending &&
                assignMutation.variables?.salesRepId === salesRep.salesRepId;

              return (
                <tr key={salesRep.salesRepId} className="border-t align-top">
                  <td className="px-4 py-3 font-medium">{salesRep.displayName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{salesRep.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    {salesRep.currentTerritory ? (
                      <span>
                        {salesRep.currentTerritory.name} ({salesRep.currentTerritory.code})
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Territory for ${salesRep.displayName}`}
                      className="h-9 min-w-52 rounded-md border bg-background px-3 text-sm"
                      value={selectedTerritoryId}
                      disabled={isSubmitting || unassignedTerritories.length === 0}
                      onChange={(event) => {
                        setSelectedTerritories((selected) => ({
                          ...selected,
                          [salesRep.salesRepId]: event.target.value,
                        }));
                        setRowErrors((errors) => {
                          const { [salesRep.salesRepId]: _, ...remainingErrors } = errors;
                          return remainingErrors;
                        });
                      }}
                    >
                      <option value="">
                        {unassignedTerritories.length === 0
                          ? "No unassigned territories"
                          : "Select a territory"}
                      </option>
                      {unassignedTerritories.map((territory) => (
                        <option key={territory.territoryId} value={territory.territoryId}>
                          {territory.name} ({territory.code})
                        </option>
                      ))}
                    </select>
                    {rowErrors[salesRep.salesRepId] && (
                      <p className="mt-1 max-w-xs text-xs text-destructive" role="alert">
                        {rowErrors[salesRep.salesRepId]}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!selectedTerritoryId || isSubmitting}
                      onClick={() =>
                        assignMutation.mutate({
                          territoryId: selectedTerritoryId,
                          salesRepId: salesRep.salesRepId,
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

        {salesReps.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No Sales Reps found.</p>
        )}
      </div>
    </section>
  );
}
