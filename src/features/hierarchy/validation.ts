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
  ownerEmail: string;
  address: string;
  latitude: string;
  longitude: string;
  creditLimit: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!input.territoryId) errors.territoryId = "Select a territory.";
  if (!input.name.trim()) errors.name = "Shop name is required.";
  if (!input.ownerEmail.trim()) {
    errors.ownerEmail = "Owner email is required; the owner's login is created with it.";
  } else if (!isEmail(input.ownerEmail)) {
    errors.ownerEmail = "Enter a valid email address.";
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

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateStaff(input: {
  role: string;
  displayName: string;
  email: string;
  phone: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!input.role) errors.role = "Choose a role.";
  if (!input.displayName.trim()) errors.displayName = "Name is required.";
  else if (input.displayName.trim().length > 200) errors.displayName = "Name is too long.";

  if (!input.email.trim()) errors.email = "Email is required; it becomes their login.";
  else if (!isEmail(input.email)) errors.email = "Enter a valid email address.";

  if (input.phone.trim().length > 40) errors.phone = "Phone number is too long.";

  return errors;
}
