import { apiFetch } from "@/api/client";

export type Status = "Active" | "Inactive";
export type Page<T> = { items: T[]; totalCount: number; page: number; pageSize: number };
export type Province = { provinceId: string; name: string; code: string; status: Status };
export type Agency = {
  agencyId: string;
  provinceId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: Status;
  createdAt: string;
};
export type Territory = {
  territoryId: string;
  provinceId: string;
  code: string;
  name: string;
  geographicDescription?: string | null;
  status: Status;
  createdAt: string;
};

export type TerritoryAgencyAssignment = {
  assignmentId: string;
  territoryId: string;
  agencyId: string;
  startsAt: string;
};

export type SalesRep = {
  salesRepId: string;
  displayName: string;
  email?: string | null;
  status: Status;
  currentTerritory?: Territory | null;
};

export type SalesRepTerritoryAssignment = {
  assignmentId: string;
  territoryId: string;
  salesRepId: string;
  startsAt: string;
};

export type Shop = {
  shopId: string;
  territoryId: string;
  name: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  creditLimit: number;
  status: Status;
  createdAt: string;
  updatedAt?: string | null;
};

export type ShopInput = {
  territoryId: string;
  name: string;
  ownerName: string;
  /** A login is created for the owner with this email (no identity sub needed). */
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  latitude: number;
  longitude: number;
  creditLimit: number;
};

export type CompanyAdmin = {
  staffProfileId: string;
  displayName: string;
  email?: string | null;
  status: Status;
};

export type HierarchyRollUpProvince = {
  provinceId: string;
  code: string;
  name: string;
  status: Status;
  currentManager?: {
    staffProfileId: string;
    displayName: string;
    email?: string | null;
    reportsToAdmin?: {
      staffProfileId: string;
      displayName: string;
      email?: string | null;
    } | null;
  } | null;
  agencyCount: number;
  territoryCount: number;
  shopCount: number;
  unassignedTerritoryCount: number;
  hasUnassignedTerritories: boolean;
};

type HierarchyResponse = {
  provinces: Array<{
    agencies: Array<{
      territories: Array<{
        territoryId: string;
        code: string;
        name: string;
      }>;
    }>;
  }>;
};

export class ApiProblem extends Error {
  constructor(
    public readonly status: number,
    public readonly detail?: string,
    public readonly title?: string,
  ) {
    super(detail || title || `Request failed (${status})`);
  }
}
async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) return (await response.json()) as T;
  let body: { detail?: string; title?: string } = {};
  try {
    body = (await response.json()) as typeof body;
  } catch {
    /* ignored */
  }
  throw new ApiProblem(response.status, body.detail, body.title);
}
export const fetchProvinces = () => apiFetch("/api/provinces").then(unwrap<Province[]>);

export const fetchHierarchyRollUp = () =>
  apiFetch("/api/hierarchy/roll-up").then(unwrap<HierarchyRollUpProvince[]>);

export const fetchCompanyAdmins = () =>
  apiFetch("/api/company-admins").then(unwrap<CompanyAdmin[]>);

export const updateAreaManagerReportsTo = (provinceId: string, reportsToAdminId: string) =>
  apiFetch(`/api/provinces/${provinceId}/area-manager/reports-to`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportsToAdminId }),
  }).then(unwrap<{ reportsToAdminId: string }>);

export const fetchAgencies = () =>
  apiFetch("/api/agencies?page=1&pageSize=100").then(unwrap<Page<Agency>>);

export const fetchTerritories = () =>
  apiFetch("/api/territories?page=1&pageSize=100").then(unwrap<Page<Territory>>);

export const fetchUnassignedTerritories = () =>
  apiFetch("/api/territories?assigned=false&page=1&pageSize=100").then(unwrap<Page<Territory>>);

export const assignTerritoryToAgency = (territoryId: string, agencyId: string) =>
  apiFetch(`/api/territories/${territoryId}/agency`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agencyId }),
  }).then(unwrap<TerritoryAgencyAssignment>);

export const fetchSalesReps = () => apiFetch("/api/sales-reps").then(unwrap<SalesRep[]>);

export const fetchUnassignedRepTerritories = () =>
  apiFetch("/api/sales-reps/unassigned-territories").then(unwrap<Territory[]>);

export const assignSalesRepToTerritory = (territoryId: string, salesRepId: string) =>
  apiFetch(`/api/territories/${territoryId}/sales-rep`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ salesRepId }),
  }).then(unwrap<SalesRepTerritoryAssignment>);

export const createAgency = (input: {
  provinceId: string;
  operatorId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}) =>
  apiFetch("/api/agencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<Agency>);

export const createTerritory = (input: {
  provinceId: string;
  code: string;
  name: string;
  geographicDescription?: string;
}) =>
  apiFetch("/api/territories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<Territory>);
export const fetchShops = (filters: {
  territoryId?: string;
  status?: Status;
  page?: number;
  pageSize?: number;
}) => {
  const query = new URLSearchParams({
    status: filters.status ?? "Active",
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 25),
  });

  if (filters.territoryId) query.set("territoryId", filters.territoryId);

  return apiFetch(`/api/shops?${query}`).then(unwrap<Page<Shop>>);
};

/** A login created by Organization in WSO2 IS. The password is shown once. */
export type ProvisionedLogin = {
  identitySub: string;
  userName: string;
  temporaryPassword?: string | null;
};

export type ShopCreated = Pick<Shop, "shopId" | "territoryId" | "name" | "status" | "createdAt"> & {
  ownerLogin?: ProvisionedLogin | null;
};

export const createShop = (input: ShopInput) =>
  apiFetch("/api/shops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<ShopCreated>);

export type StaffRole = "CompanyAdmin" | "AreaManager" | "AgencyOperator" | "SalesRep";

export type StaffInput = {
  role: StaffRole;
  displayName: string;
  email: string;
  phone: string;
};

export type CreatedStaff = {
  staffProfileId: string;
  role: StaffRole;
  displayName: string;
  email: string;
  phone?: string | null;
  status: Status;
  identitySub: string;
  userName: string;
  temporaryPassword?: string | null;
};

/** One call creates the WSO2 login and the staff profile, linked by the login's ID. */
export const createStaff = (input: StaffInput) =>
  apiFetch("/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, phone: input.phone.trim() || null }),
  }).then(unwrap<CreatedStaff>);

export const fetchOperatorTerritories = async () => {
  const hierarchy = await apiFetch("/api/hierarchy").then(unwrap<HierarchyResponse>);

  return hierarchy.provinces.flatMap((province) =>
    province.agencies.flatMap((agency) => agency.territories),
  );
};
