import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { ApiProblem, createShop, fetchOperatorTerritories, fetchShops, type Status } from "./api";
import { validateShop, type FormErrors } from "./validation";

const initialForm = {
  territoryId: "",
  name: "",
  ownerName: "",
  ownerIdentitySub: "",
  ownerEmail: "",
  ownerPhone: "",
  address: "",
  latitude: "",
  longitude: "",
  creditLimit: "",
};

function mapServerError(error: unknown): FormErrors {
  const message =
    error instanceof ApiProblem
      ? (error.detail ?? error.message)
      : "Could not register the shop. Please try again.";

  const text = message.toLowerCase();

  if (text.includes("territory") || text.includes("agency")) {
    return { territoryId: message };
  }
  if (text.includes("latitude")) return { latitude: message };
  if (text.includes("longitude") || text.includes("coordinate")) {
    return { longitude: message };
  }
  if (text.includes("credit")) return { creditLimit: message };
  if (text.includes("owneridentitysub") || text.includes("owner identity")) {
    return { ownerIdentitySub: message };
  }

  return { form: message };
}

export function ShopPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [territoryFilter, setTerritoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("Active");
  const [page, setPage] = useState(1);

  const territories = useQuery({
    queryKey: ["operator-territories"],
    queryFn: fetchOperatorTerritories,
  });

  const shops = useQuery({
    queryKey: ["shops", territoryFilter, statusFilter, page],
    queryFn: () =>
      fetchShops({
        territoryId: territoryFilter || undefined,
        status: statusFilter,
        page,
        pageSize: 25,
      }),
  });

  const register = useMutation({
    mutationFn: () =>
      createShop({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        creditLimit: Number(form.creditLimit),
      }),
    onSuccess: async () => {
      setForm(initialForm);
      setErrors({});
      await queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
    onError: (error) => setErrors(mapServerError(error)),
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const { [field]: _, ...remaining } = current;
      return remaining;
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors = validateShop(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      register.mutate();
    }
  }

  const shopPage = shops.data;
  const totalPages = Math.max(
    1,
    Math.ceil((shopPage?.totalCount ?? 0) / (shopPage?.pageSize ?? 25)),
  );

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shops</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register and manage shops in your agency territories.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Register shop</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="territoryId" className="block text-sm font-medium">
              Territory
            </label>
            <select
              id="territoryId"
              value={form.territoryId}
              onChange={(event) => updateField("territoryId", event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a territory</option>
              {(territories.data ?? []).map((territory) => (
                <option key={territory.territoryId} value={territory.territoryId}>
                  {territory.name} ({territory.code})
                </option>
              ))}
            </select>
            {errors.territoryId && <p className="text-xs text-destructive">{errors.territoryId}</p>}
          </div>

          <FormField
            label="Shop name"
            value={form.name}
            error={errors.name}
            onChange={(event) => updateField("name", event.target.value)}
          />

          <FormField
            label="Owner name"
            value={form.ownerName}
            onChange={(event) => updateField("ownerName", event.target.value)}
          />

          <FormField
            label="Shop Owner identity sub"
            value={form.ownerIdentitySub}
            error={errors.ownerIdentitySub}
            hint="The unique identity subject from WSO2."
            onChange={(event) => updateField("ownerIdentitySub", event.target.value)}
          />

          <FormField
            label="Owner email"
            type="email"
            value={form.ownerEmail}
            onChange={(event) => updateField("ownerEmail", event.target.value)}
          />

          <FormField
            label="Owner phone"
            value={form.ownerPhone}
            onChange={(event) => updateField("ownerPhone", event.target.value)}
          />

          <FormField
            label="Address"
            value={form.address}
            error={errors.address}
            onChange={(event) => updateField("address", event.target.value)}
          />

          <FormField
            label="Latitude"
            type="number"
            step="any"
            inputMode="decimal"
            placeholder="e.g. 6.927079"
            value={form.latitude}
            error={errors.latitude}
            onChange={(event) => updateField("latitude", event.target.value)}
          />

          <FormField
            label="Longitude"
            type="number"
            step="any"
            inputMode="decimal"
            placeholder="e.g. 79.861244"
            value={form.longitude}
            error={errors.longitude}
            onChange={(event) => updateField("longitude", event.target.value)}
          />

          <FormField
            label="Credit limit"
            type="number"
            min="0.01"
            step="0.01"
            value={form.creditLimit}
            error={errors.creditLimit}
            onChange={(event) => updateField("creditLimit", event.target.value)}
          />
        </div>

        {errors.form && <p className="mt-4 text-sm text-destructive">{errors.form}</p>}

        <div className="mt-5">
          <Button type="submit" disabled={register.isPending}>
            {register.isPending ? "Registering…" : "Register shop"}
          </Button>
        </div>
      </form>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Shop list</h2>
            <p className="text-sm text-muted-foreground">
              {shopPage?.totalCount ?? 0} shop(s) found.
            </p>
          </div>

          <div className="flex gap-3">
            <select
              value={territoryFilter}
              onChange={(event) => {
                setTerritoryFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All my territories</option>
              {(territories.data ?? []).map((territory) => (
                <option key={territory.territoryId} value={territory.territoryId}>
                  {territory.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as Status);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {shops.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading shops…</p>
        ) : shops.isError ? (
          <p className="text-sm text-destructive">Could not load shops.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Shop</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Address</th>
                    <th className="px-4 py-3 font-medium">Credit limit</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(shopPage?.items ?? []).map((shop) => (
                    <tr key={shop.shopId} className="border-t">
                      <td className="px-4 py-3 font-medium">{shop.name}</td>
                      <td className="px-4 py-3">{shop.ownerName || "—"}</td>
                      <td className="px-4 py-3">{shop.address}</td>
                      <td className="px-4 py-3">{shop.creditLimit.toFixed(2)}</td>
                      <td className="px-4 py-3">{shop.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </section>
    </section>
  );
}
