import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { readStore } from "@/lib/store";

export default async function AdminPage() {
  const user = await requireUser();
  const data = await readStore();
  const failed = data.audits.filter((audit) => audit.status === "failed");
  const running = data.audits.filter((audit) => audit.status === "running" || audit.status === "queued");
  const completed = data.audits.filter((audit) => audit.status === "completed");
  const avgRuntime = completed.length
    ? Math.round(completed.reduce((sum, audit) => sum + (audit.durationMs ?? 0), 0) / completed.length / 1000)
    : 0;
  return (
    <AppShell user={user} title="System health" subtitle="Minimal operator view for queue and audit outcomes.">
      <div className="grid cols-4">
        <div className="card">
          <div className="metric">Users</div>
          <div className="big">{data.users.length}</div>
        </div>
        <div className="card">
          <div className="metric">Websites</div>
          <div className="big">{data.websites.length}</div>
        </div>
        <div className="card">
          <div className="metric">Open jobs</div>
          <div className="big">{running.length}</div>
        </div>
        <div className="card">
          <div className="metric">Avg runtime</div>
          <div className="big">{avgRuntime}s</div>
        </div>
      </div>
      <div style={{ height: 18 }} />
      <div className="card">
        <h2>Failed audits</h2>
        <table className="table">
          <tbody>
            {failed.slice(0, 20).map((audit) => (
              <tr key={audit.id}>
                <td>{audit.requestedUrl}</td>
                <td>{audit.failureReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
