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

/**
 * Typed accessor for Sellora auth state.
 * Reads decoded claims (role, companyId) from the OIDC token so components
 * never parse the token themselves.
 */
export function useSelloraAuth(): SelloraAuth {
  const auth = useAuth();
  const profile = auth.user?.profile;

  const roles: string[] = Array.isArray(profile?.roles)
    ? (profile.roles as string[])
    : [];

  const role = KNOWN_ROLES.find((r) => roles.includes(r)) ?? null;

  const companyId =
    typeof profile?.companyId === "string" ? profile.companyId : null;

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    role,
    roles,
    companyId,
    accessToken: auth.user?.access_token ?? null,
    username:
      (typeof profile?.preferred_username === "string"
        ? profile.preferred_username
        : null) ??
      profile?.sub ??
      null,
  };
}