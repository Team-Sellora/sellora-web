import { useAuth } from "react-oidc-context";

// The five Sellora roles from US-E0-1.
export type SelloraRole =
  | "CompanyAdmin"
  | "AreaManager"
  | "AgencyOperator"
  | "SalesRep"
  | "ShopOwner";

export interface SelloraAuth {
  isAuthenticated: boolean;
  isLoading: boolean;
  /** The user's Sellora role (first recognised role in the token). */
  role: SelloraRole | null;
  /** All roles present in the token. */
  roles: string[];
  /** Tenant identifier — every API query is scoped to this. */
  companyId: string | null;
  /** Raw access token (in memory) for API calls. */
  accessToken: string | null;
  /** Username / subject display. */
  username: string | null;
}

const KNOWN_ROLES: SelloraRole[] = [
  "CompanyAdmin",
  "AreaManager",
  "AgencyOperator",
  "SalesRep",
  "ShopOwner",
];
