import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GitFork, MapPin, Activity } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { OverviewCards } from "@/components/OverviewCards";
import { recentActivity, summaryStats } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sellora Management Console" },
      {
        name: "description",
        content:
          "Overview of agencies, territories, shops and active field reps across the Sellora distribution network.",
      },
      { property: "og:title", content: "Dashboard — Sellora Management Console" },
      {
        property: "og:description",
        content: "Overview of agencies, territories, shops and active field reps.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <>
      <PageHeader
        title="Operations Dashboard"
        description="Overview of FMCG distribution hierarchy, active territories, and field operations."
        crumbs={[{ label: "Overview" }]}
      />

      <OverviewCards items={summaryStats} />
      <div className="dashboard-grid">
        <section className="stitch-panel">
          <h2>Territory Coverage Density</h2>
          <p>Distribution coverage across the field-sales network</p>
          <div className="coverage-panel">
            <div>
              <p>Territory coverage</p>
              <strong>Live location data is not available yet</strong>
              <span className="mt-2 block text-xs">
                Explore existing territories and assignments below.
              </span>
            </div>
          </div>
        </section>
        <div className="dashboard-stack">
          <section className="stitch-panel">
            <h2>Store Check-in Target</h2>
            <p>Daily field visits and route completion</p>
            <div className="dashboard-placeholder">Check-in reporting is not available yet.</div>
          </section>
          <section className="stitch-panel">
            <h2>Multi-Tier Roll-up</h2>
            <Link to="/hierarchy-roll-up" className="dashboard-shortcut">
              <GitFork size={20} />
              Inspect hierarchy
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="stitch-panel">
          <h2>Recent Hierarchy &amp; Distribution Activity</h2>
          <p>Recent activity across the distribution network</p>
          <ul className="dashboard-activity">
            {recentActivity.map((item) => (
              <li key={item.id} className="text-sm">
                <span className="person-avatar" aria-hidden="true">
                  <Activity size={16} />
                </span>
                <div>
                  <span>{item.text}</span>
                  <time>{item.time}</time>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <div className="dashboard-stack">
          <section className="stitch-panel">
            <h2>System Health &amp; Sync</h2>
            <p>Service monitoring and synchronization</p>
            <div className="dashboard-placeholder">
              Service health reporting is not available yet.
            </div>
          </section>
          <section className="stitch-panel">
            <h2>Configuration Shortcuts</h2>
            <p>Quick jump into organizational planning tools</p>
            <Link to="/hierarchy-roll-up" className="dashboard-shortcut">
              <GitFork size={20} />
              <span>Hierarchy Roll-up</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/territory-assignments" className="dashboard-shortcut">
              <MapPin size={20} />
              <span>Assign Territories</span>
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
