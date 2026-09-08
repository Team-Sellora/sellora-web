import { useAuth } from "react-oidc-context";

// The five Sellora roles from US-E0-1.
export type SelloraRole =
  "CompanyAdmin" | "AreaManager" | "AgencyOperator" | "SalesRep" | "ShopOwner";

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
  logout: () => Promise<void>;
}

const KNOWN_ROLES: SelloraRole[] = [
  "CompanyAdmin",
  "AreaManager",
  "AgencyOperator",
  "SalesRep",
  "ShopOwner",
];

/** Claims we read from the (access) token. */
interface SelloraClaims {
  roles?: unknown;
  companyId?: unknown;
}

/** Decode a JWT payload (access token) into its claims object. */
function decodeJwtPayload(token: string): SelloraClaims {
  try {
    const base64Url = token.split(".")[1]!;
    const base64 = base64Url.replaceAll("-", "+").replaceAll("_", "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.codePointAt(0)!.toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json) as SelloraClaims;
  } catch {
    return {};
  }
}

/**
 * Typed accessor for Sellora auth state.
 * Reads decoded claims (role, companyId) from the OIDC token so components
 * never parse the token themselves.
 */
export function useSelloraAuth(): SelloraAuth {
  const auth = useAuth();
  const profile = auth.user?.profile;
  const accessToken = auth.user?.access_token ?? null;

  // Roles and companyId live in the ACCESS token, not the ID token.
  const claims = accessToken ? decodeJwtPayload(accessToken) : {};

  const roles: string[] = Array.isArray(claims.roles) ? (claims.roles as string[]) : [];
  const role = KNOWN_ROLES.find((r) => roles.includes(r)) ?? null;
  const companyId = typeof claims.companyId === "string" ? claims.companyId : null;

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    role,
    roles,
    companyId,
    accessToken,
    username:
      (typeof profile?.preferred_username === "string" ? profile.preferred_username : null) ??
      profile?.sub ??
      null,
    logout: () => auth.signoutRedirect(),
  };
}
