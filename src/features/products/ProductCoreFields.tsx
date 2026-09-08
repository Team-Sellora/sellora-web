import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { productInputClass } from "./productFormStyles";
import type { ProductCoreFormErrors, ProductCoreFormValues } from "./types";

const unitOptions = ["Bottle", "Can", "Case", "Pack", "Piece", "Box", "Kg", "Litre"];

export function FieldError({ message }: Readonly<{ message?: string | undefined }>) {
  if (!message) {
    return null;
  }

  return (
    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
      <AlertCircle className="size-3.5" />
      {message}
    </p>
  );
}

interface FieldLabelProps {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}

export function FieldLabel({
  htmlFor,
  children,
  required = false,
  hint,
}: Readonly<FieldLabelProps>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {children}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {hint && (
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}

interface ProductCoreFieldsProps {
  values: ProductCoreFormValues;
  errors: ProductCoreFormErrors;
  onChange: (field: keyof ProductCoreFormValues, value: string) => void;
  editing?: boolean;
}

export function ProductCoreFields({
  values,
  errors,
  onChange,
  editing = false,
}: Readonly<ProductCoreFieldsProps>) {
  const hasCustomUnit =
    editing && values.unitOfMeasure !== "" && !unitOptions.includes(values.unitOfMeasure);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <FieldLabel htmlFor="sku" required hint="Unique key">
          SKU
        </FieldLabel>
        <input
          id="sku"
          name="sku"
          type="text"
          value={values.sku}
          maxLength={80}
          autoComplete="off"
          placeholder={editing ? undefined : "e.g. SKU-BEV-001"}
          aria-invalid={!!errors.sku}
          onChange={(event) => onChange("sku", event.target.value.toUpperCase())}
          className={cn(productInputClass(!!errors.sku), "font-mono")}
        />
        <FieldError message={errors.sku} />
        {!errors.sku && (
          <p className="text-xs text-muted-foreground">
            {editing
              ? "The SKU must remain unique within your company."
              : "Must be unique within your company."}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="name" required>
          Product name
        </FieldLabel>
        <input
          id="name"
          name="name"
          type="text"
          value={values.name}
          maxLength={200}
          placeholder={editing ? undefined : "e.g. Fresh Milk 1L"}
          aria-invalid={!!errors.name}
          onChange={(event) => onChange("name", event.target.value)}
          className={productInputClass(!!errors.name)}
        />
        <FieldError message={errors.name} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="description" hint={`${values.description.length}/1000`}>
          Description
        </FieldLabel>
        <textarea
          id="description"
          name="description"
          rows={editing ? 4 : 3}
          value={values.description}
          maxLength={1000}
          placeholder={editing ? undefined : "Describe the product for catalogue users."}
          aria-invalid={!!errors.description}
          onChange={(event) => onChange("description", event.target.value)}
          className={cn(
            "w-full resize-y rounded-lg border bg-background p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40",
            errors.description ? "border-destructive" : "border-input focus:border-ring",
          )}
        />
        <FieldError message={errors.description} />
      </div>

      <div className="space-y-1.5">
        <FieldLabel htmlFor="unitOfMeasure" required>
          Unit of measure
        </FieldLabel>
        <select
          id="unitOfMeasure"
          name="unitOfMeasure"
          value={values.unitOfMeasure}
          aria-invalid={!!errors.unitOfMeasure}
          onChange={(event) => onChange("unitOfMeasure", event.target.value)}
          className={productInputClass(!!errors.unitOfMeasure)}
        >
          <option value="">Select a unit</option>
          {unitOptions.map((unit) => (
            <option key={unit} value={unit}>
              {unit === "Kg" ? "Kilogram" : unit}
            </option>
          ))}
          {hasCustomUnit && <option value={values.unitOfMeasure}>{values.unitOfMeasure}</option>}
        </select>
        <FieldError message={errors.unitOfMeasure} />
      </div>
    </div>
  );
}
