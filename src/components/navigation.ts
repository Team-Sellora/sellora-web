import {
  ArrowLeftRight,
  Boxes,
  Building2,
  ClipboardList,
  GitFork,
  LayoutDashboard,
  MailWarning,
  Map,
  MapPin,
  Package,
  Store,
  Tags,
  Truck,
  Undo2,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { isRoleAllowed } from "@/auth/roleAccess";
import type { SelloraRole } from "@/auth/useSelloraAuth";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface NavSection {
  /** Null for the ungrouped top item (Dashboard). */
  title: string | null;
  items: NavItem[];
}

/**
 * Every screen in the sidebar, grouped by what it's for. Which ones a user
 * actually sees is decided by `navigationFor`, from the same `routeAccess`
 * table the RouteGuard enforces — so the menu can never offer a page the
 * guard would then refuse, and adding a role to a route updates both.
 */
export const navSections: NavSection[] = [
  {
    title: null,
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Network",
    items: [
      { to: "/provinces", label: "Provinces", icon: Map },
      { to: "/area-managers", label: "Area Managers", icon: UserCog },
      { to: "/hierarchy-roll-up", label: "Hierarchy roll-up", icon: GitFork },
      { to: "/agencies", label: "Agencies", icon: Building2 },
      { to: "/territories", label: "Territories", icon: MapPin },
      { to: "/territory-assignments", label: "Assign territories", icon: ArrowLeftRight },
      { to: "/shops", label: "Shops", icon: Store },
    ],
  },
  {
    title: "People",
    items: [
      { to: "/staff", label: "Team", icon: UserPlus },
      { to: "/sales-reps", label: "Sales Reps", icon: Users },
    ],
  },
  {
    title: "Catalogue & stock",
    items: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/product-categories", label: "Product categories", icon: Tags },
      { to: "/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    title: "Sales",
    items: [
      { to: "/orders", label: "Orders", icon: ClipboardList },
      { to: "/deliveries", label: "Deliveries", icon: Truck },
      { to: "/van-returns", label: "Van returns", icon: Undo2 },
    ],
  },
  {
    title: "Admin",
    items: [{ to: "/notifications", label: "Failed notifications", icon: MailWarning }],
  },
];

/**
 * The sidebar for one role: only screens that role can open, empty sections
 * dropped. Before the role is known (sign-in still loading) only the
 * Dashboard is shown, never the full list.
 */
export function navigationFor(role: SelloraRole | null): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.to === "/" ? true : role !== null && isRoleAllowed(item.to, role),
      ),
    }))
    .filter((section) => section.items.length > 0);
}
