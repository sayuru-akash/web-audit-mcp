import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { getOperationalHealth } from "@/lib/audit-service";
import { getStoreHealth } from "@/lib/store";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "System Health",
  ...noIndexMetadata,
};

export default async function AdminPage() {
  const user = await requireAdmin();
  const health = await getOperationalHealth();
  const store = await getStoreHealth();
  return (
    <AppShell user={user} title="System health" subtitle="Minimal operator view for queue and audit outcomes.">
      <div className="grid cols-4">
        <div className="card">
          <div className="metric">Users</div>
          <div className="big">{health.totals.users}</div>
        </div>
        <div className="card">
          <div className="metric">Websites</div>
          <div className="big">{health.totals.websites}</div>
        </div>
        <div className="card">
          <div className="metric">Open jobs</div>
          <div className="big">{health.totals.queued + health.totals.running}</div>
        </div>
        <div className="card">
          <div className="metric">Stale jobs</div>
          <div className="big">{health.totals.stale}</div>
        </div>
      </div>
      <div style={{ height: 18 }} />
      <div className="grid cols-2">
        <section className="card">
          <h2>Queue health</h2>
          <p className="muted">Queued: {health.totals.queued}</p>
          <p className="muted">Running: {health.totals.running}</p>
          <p className="muted">Oldest queued age: {Math.round(health.oldestQueuedAgeMs / 1000)}s</p>
          <p className="muted">Scheduled overdue: {health.totals.scheduledOverdue}</p>
        </section>
        <section className="card">
          <h2>Store health</h2>
          <p className="muted">Path: {store.path}</p>
          <p className="muted">Size: {store.sizeBytes ?? 0} bytes</p>
          <p className="muted">Updated: {store.updatedAt ?? "Not created yet"}</p>
        </section>
      </div>
      <div style={{ height: 18 }} />
      <div className="card">
        <h2>Failed audits</h2>
        <table className="table">
          <tbody>
            {health.recentFailures.map((audit) => (
              <tr key={audit.id}>
                <td>{audit.requestedUrl}</td>
                <td>{audit.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
