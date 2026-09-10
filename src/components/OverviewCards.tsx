import type { ReactNode } from "react";
import { Building2, Globe2, Store, Users } from "lucide-react";

const icons = [Globe2, Users, Building2, Store];

/** Presentation of existing query results. Missing values stay visibly unavailable. */
export function OverviewCards({
  items,
}: Readonly<{
  items: { label: string; value: ReactNode; detail?: string }[];
}>) {
  return (
    <div className="overview-cards">
      {items.map((item, index) => {
        const Icon = icons[index % icons.length] ?? Globe2;
        return (
          <section className="overview-card" key={item.label}>
            <div>
              <p className="metric-label">{item.label}</p>
              <div className="metric-value">{item.value ?? "—"}</div>
              {item.detail && <p className="metric-detail">{item.detail}</p>}
            </div>
            <span className="metric-icon">
              <Icon size={20} aria-hidden="true" />
            </span>
          </section>
        );
      })}
    </div>
  );
}
