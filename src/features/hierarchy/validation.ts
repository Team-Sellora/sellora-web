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

export function validateShop(input: {
  territoryId: string;
  name: string;
  ownerIdentitySub: string;
  address: string;
  latitude: string;
  longitude: string;
  creditLimit: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!input.territoryId) errors.territoryId = "Select a territory.";
  if (!input.name.trim()) errors.name = "Shop name is required.";
  if (!input.ownerIdentitySub.trim()) {
    errors.ownerIdentitySub = "Shop Owner identity sub is required.";
  }
  if (!input.address.trim()) errors.address = "Address is required.";

  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  const creditLimit = Number(input.creditLimit);

  if (!input.latitude.trim()) {
    errors.latitude = "Latitude is required.";
  } else if (!Number.isFinite(latitude) || latitude < 5.9 || latitude > 9.9) {
    errors.latitude = "Latitude must be within Sri Lanka (5.9 to 9.9).";
  }

  if (!input.longitude.trim()) {
    errors.longitude = "Longitude is required.";
  } else if (!Number.isFinite(longitude) || longitude < 79.4 || longitude > 81.9) {
    errors.longitude = "Longitude must be within Sri Lanka (79.4 to 81.9).";
  }

  if (!input.creditLimit.trim()) {
    errors.creditLimit = "Credit limit is required.";
  } else if (!Number.isFinite(creditLimit) || creditLimit <= 0) {
    errors.creditLimit = "Credit limit must be greater than zero.";
  }

  return errors;
}
