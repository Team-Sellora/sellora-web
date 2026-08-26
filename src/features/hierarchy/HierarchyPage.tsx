import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import {
  ApiProblem,
  createAgency,
  createTerritory,
  fetchAgencies,
  fetchProvinces,
  fetchTerritories,
} from "./api";
import { validateAgency, validateTerritory } from "./validation";

type Kind = "agency" | "territory";
type Errors = Record<string, string>;
const messageErrors = (error: unknown): Errors => {
  const message = error instanceof ApiProblem ? error.message : "Could not save. Please try again.";
  const text = message.toLowerCase();
  if (text.includes("province")) return { provinceId: message };
  if (text.includes("operator")) return { operatorId: message };
  if (text.includes("code")) return { code: message };
  if (text.includes("name") || text.includes("duplicate")) return { name: message };
  return { form: message };
};

export function HierarchyPage({ kind }: Readonly<{ kind: Kind }>) {
  const auth = useSelloraAuth();
  const queryClient = useQueryClient();
  const canCreate = auth.role === "AreaManager";
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [agency, setAgency] = useState({
    provinceId: "",
    operatorId: "",
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [territory, setTerritory] = useState({
    provinceId: "",
    code: "",
    name: "",
    geographicDescription: "",
  });
  const provinces = useQuery({ queryKey: ["provinces"], queryFn: fetchProvinces });
  const entities = useQuery({
    queryKey: [kind],
    queryFn: kind === "agency" ? fetchAgencies : fetchTerritories,
  });
  const mutation = useMutation({
    mutationFn: async () => (kind === "agency" ? createAgency(agency) : createTerritory(territory)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [kind] });
      setErrors({});
      setOpen(false);
    },
    onError: (error) => setErrors(messageErrors(error)),
  });
  const provinceNames = useMemo(
    () => new Map((provinces.data ?? []).map((p) => [p.provinceId, `${p.name} (${p.code})`])),
    [provinces.data],
  );
  const title = kind === "agency" ? "Agencies" : "Territories";
  const rows = entities.data?.items ?? [];
  function submit() {
    const next =
      kind === "agency"
        ? validateAgency(agency)
        : validateTerritory(territory, entities.data?.items.map((item) => item.code) ?? []);
    setErrors(next);
    if (Object.keys(next).length === 0) mutation.mutate();
  }
  const provinceValue = kind === "agency" ? agency.provinceId : territory.provinceId;
  return (
    <>
      <PageHeader
        title={title}
        description={`View and manage ${title.toLowerCase()} in your assigned scope.`}
        crumbs={[{ label: title }]}
        actions={
          canCreate ? (
            <Button onClick={() => setOpen(!open)}>{open ? "Close" : `Register ${kind}`}</Button>
          ) : undefined
        }
      />
      {!canCreate && (
        <p className="mb-4 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Only Area Managers can register {title.toLowerCase()}.
        </p>
      )}
      {open && (
        <section className="mb-6 rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">Register {kind}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="provinceId" className="block text-sm font-medium">
                Province
              </label>
              <select
                id="provinceId"
                value={provinceValue}
                onChange={(e) =>
                  kind === "agency"
                    ? setAgency({ ...agency, provinceId: e.target.value })
                    : setTerritory({ ...territory, provinceId: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select a province</option>
                {(provinces.data ?? [])
                  .filter((p) => p.status === "Active")
                  .map((p) => (
                    <option key={p.provinceId} value={p.provinceId}>
                      {p.name} ({p.code})
                    </option>
                  ))}
              </select>
              {errors.provinceId && <p className="text-xs text-destructive">{errors.provinceId}</p>}
            </div>
            {kind === "agency" && (
              <FormField
                label="Agency operator ID"
                value={agency.operatorId}
                onChange={(e) => setAgency({ ...agency, operatorId: e.target.value })}
                error={errors.operatorId}
                placeholder="Operator staff-profile GUID"
              />
            )}
            {kind === "territory" && (
              <FormField
                label="Territory code"
                value={territory.code}
                onChange={(e) => setTerritory({ ...territory, code: e.target.value })}
                error={errors.code}
                placeholder="e.g. WP-T-01"
              />
            )}
            <FormField
              label={`${kind === "agency" ? "Agency" : "Territory"} name`}
              value={kind === "agency" ? agency.name : territory.name}
              onChange={(e) =>
                kind === "agency"
                  ? setAgency({ ...agency, name: e.target.value })
                  : setTerritory({ ...territory, name: e.target.value })
              }
              error={errors.name}
            />
            {kind === "agency" && (
              <FormField
                label="Email"
                type="email"
                value={agency.email}
                onChange={(e) => setAgency({ ...agency, email: e.target.value })}
              />
            )}
            {kind === "agency" && (
              <FormField
                label="Phone"
                value={agency.phone}
                onChange={(e) => setAgency({ ...agency, phone: e.target.value })}
              />
            )}
          </div>
          {errors.form && <p className="mt-3 text-sm text-destructive">{errors.form}</p>}
          <div className="mt-5">
            <Button onClick={submit} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : `Create ${kind}`}
            </Button>
          </div>
        </section>
      )}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              {kind === "territory" && <th className="px-4 py-3">Code</th>}
              <th className="px-4 py-3">Province</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {entities.isPending && (
              <tr>
                <td className="px-4 py-6" colSpan={4}>
                  Loading…
                </td>
              </tr>
            )}
            {entities.isError && (
              <tr>
                <td className="px-4 py-6 text-destructive" colSpan={4}>
                  Could not load {title.toLowerCase()}.
                </td>
              </tr>
            )}
            {!entities.isPending && !entities.isError && rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                  No {title.toLowerCase()} found.
                </td>
              </tr>
            )}
            {rows.map((item) => (
              <tr
                key={kind === "agency" ? item.agencyId : item.territoryId}
                className="border-t border-border"
              >
                <td className="px-4 py-3">{item.name}</td>
                {kind === "territory" && <td className="px-4 py-3">{item.code}</td>}
                <td className="px-4 py-3">
                  {provinceNames.get(item.provinceId) ?? item.provinceId}
                </td>
                <td className="px-4 py-3">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
