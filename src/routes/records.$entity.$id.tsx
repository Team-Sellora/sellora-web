import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import { FormField } from "@/components/FormField";
import { PageHeader } from "@/components/PageHeader";
import { getEntity, getRecord } from "@/lib/mock-data";

export const Route = createFileRoute("/records/$entity/$id")({
  head: () => ({
    meta: [
      { title: "Record details — Sellora" },
      {
        name: "description",
        content: "Create or edit a record in the Sellora management console.",
      },
      { property: "og:title", content: "Record details — Sellora" },
      {
        property: "og:description",
        content: "Create or edit a record in the Sellora management console.",
      },
    ],
  }),
  component: RecordForm,
});

function RecordForm() {
  const { entity: slug, id } = Route.useParams();
  const navigate = useNavigate();
  const entity = getEntity(slug);
  const record = entity && id !== "new" ? getRecord(slug, id) : undefined;

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    entity?.fields.forEach((f) => {
      initial[f.key] = record?.[f.key] ?? "";
    });
    initial["status"] = record?.status ?? "Active";
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!entity) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">Unknown record type.</div>
    );
  }

  const isNew = id === "new";
  const listPath = `/${entity.slug}` as "/provinces";

  const onSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    entity.fields.forEach((f) => {
      if (!values[f.key]?.trim()) next[f.key] = `${f.label} is required`;
    });
    setErrors(next);
    // Replace with an API call later.
    if (Object.keys(next).length === 0) navigate({ to: listPath });
  };

  return (
    <>
      <PageHeader
        title={`${isNew ? "New" : "Edit"} ${entity.singular}`}
        description={
          isNew
            ? `Create a new ${entity.singular.toLowerCase()} record.`
            : `Update the details of this ${entity.singular.toLowerCase()}.`
        }
        crumbs={[{ label: entity.title, to: listPath }, { label: isNew ? "New" : "Edit" }]}
      />

      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-5 rounded-lg border border-border bg-card p-6"
      >
        {entity.fields.map((f) => (
          <FormField
            key={f.key}
            name={f.key}
            label={f.label}
            type={f.type ?? "text"}
            value={values[f.key] ?? ""}
            error={errors[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
          />
        ))}

        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            value={values["status"]}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex gap-2 border-t border-border pt-5">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save
          </button>
          <Link
            to={listPath}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
