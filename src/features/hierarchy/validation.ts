export type FormErrors = Record<string, string>;

export function validateAgency(input: {
  provinceId: string;
  operatorId: string;
  name: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (!input.provinceId) errors.provinceId = "Select a province.";
  if (!input.operatorId.trim()) errors.operatorId = "Agency operator ID is required.";
  if (!input.name.trim()) errors.name = "Agency name is required.";
  return errors;
}

export function validateTerritory(
  input: {
    provinceId: string;
    code: string;
    name: string;
  },
  existingCodes: readonly string[],
): FormErrors {
  const errors: FormErrors = {};
  if (!input.provinceId) errors.provinceId = "Select a province.";
  if (!input.code.trim()) errors.code = "Territory code is required.";
  else if (existingCodes.some((code) => code.toLowerCase() === input.code.trim().toLowerCase())) {
    errors.code = "This territory code already exists.";
  }
  if (!input.name.trim()) errors.name = "Territory name is required.";
  return errors;
}
