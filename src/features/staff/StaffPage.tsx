import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useSelloraAuth } from "@/auth/useSelloraAuth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import {
  ApiProblem,
  createStaff,
  type CreatedStaff,
  type StaffRole,
} from "@/features/hierarchy/api";
import { validateStaff, type FormErrors } from "@/features/hierarchy/validation";
import { CredentialNotice } from "./CredentialNotice";
import { creatableRoles, roleLabels } from "./staffRoles";

const nextStep: Record<StaffRole, { text: string; to: string } | null> = {
  SalesRep: { text: "Assign them a territory on the Sales Reps page.", to: "/sales-reps" },
  AreaManager: { text: "Assign them a province on the Area Managers page.", to: "/area-managers" },
  AgencyOperator: {
    text: "Choose them as the operator when registering their agency.",
    to: "/agencies",
  },
  CompanyAdmin: null,
};

export function StaffPage() {
  const { role } = useSelloraAuth();
  const roles = creatableRoles(role);
  const blank = { role: roles[0] ?? "", displayName: "", email: "", phone: "" };

  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<FormErrors>({});
  const [created, setCreated] = useState<CreatedStaff | null>(null);

  const add = useMutation({
    mutationFn: () => createStaff({ ...form, role: form.role as StaffRole }),
    onSuccess: (staff) => {
      setCreated(staff);
      setForm(blank);
      setErrors({});
    },
    onError: (error) => {
      const message =
        error instanceof ApiProblem
          ? (error.detail ?? error.message)
          : "Could not add the staff member.";
      setErrors(message.toLowerCase().includes("email") ? { email: message } : { form: message });
    },
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors(({ [field]: _removed, ...rest }) => rest);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateStaff(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) add.mutate();
  }

  const step = created ? nextStep[created.role] : null;

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a staff member. Their Sellora login is created at the same time — nothing to set up in
          WSO2.
        </p>
      </div>

      {created && (
        <CredentialNotice
          title={`${created.displayName} was added as ${roleLabels[created.role]}.`}
          userName={created.userName}
          temporaryPassword={created.temporaryPassword}
          onDismiss={() => setCreated(null)}
        >
          {step && (
            <p className="text-xs">
              Next:{" "}
              <Link to={step.to} className="font-medium text-primary hover:underline">
                {step.text}
              </Link>
            </p>
          )}
        </CredentialNotice>
      )}

      <form onSubmit={submit} noValidate className="max-w-2xl rounded-lg border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <UserPlus className="size-5" /> Add staff member
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="role" className="block text-sm font-medium">
              Role
            </label>
            <select
              id="role"
              value={form.role}
              onChange={(event) => update("role", event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {roles.map((option) => (
                <option key={option} value={option}>
                  {roleLabels[option]}
                </option>
              ))}
            </select>
            {errors["role"] && <p className="text-xs text-destructive">{errors["role"]}</p>}
          </div>

          <FormField
            label="Full name"
            value={form.displayName}
            error={errors["displayName"]}
            onChange={(event) => update("displayName", event.target.value)}
          />

          <FormField
            label="Email"
            type="email"
            value={form.email}
            error={errors["email"]}
            hint="Becomes their login username."
            onChange={(event) => update("email", event.target.value)}
          />

          <FormField
            label="Phone (optional)"
            value={form.phone}
            error={errors["phone"]}
            onChange={(event) => update("phone", event.target.value)}
          />
        </div>

        {errors["form"] && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {errors["form"]}
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <Button type="submit" disabled={add.isPending}>
            {add.isPending ? "Adding…" : "Add staff member"}
          </Button>
        </div>
      </form>
    </section>
  );
}
