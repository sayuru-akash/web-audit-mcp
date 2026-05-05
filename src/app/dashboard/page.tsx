import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AddWebsiteForm, RunAuditButton } from "@/components/forms";
import { ScoreText } from "@/components/score";
import { requireUser } from "@/lib/auth";
import { getUserDashboard, latestAuditFor } from "@/lib/store";
import { timeAgo } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const { websites, audits, notifications } = await getUserDashboard(user.id);
  const completed = audits.filter((audit) => audit.status === "completed" && audit.overallScore !== undefined);
  const average = completed.length
    ? Math.round(completed.reduce((sum, audit) => sum + (audit.overallScore ?? 0), 0) / completed.length)
    : undefined;
  const critical = notifications.filter((notification) => notification.type === "critical_issue" && !notification.read).length;
  return (
    <AppShell user={user} title="Dashboard" subtitle="The current health of your monitored websites.">
      <div className="grid cols-4">
        <div className="card">
          <div className="metric">Websites</div>
          <div className="big">{websites.length}</div>
        </div>
        <div className="card">
          <div className="metric">Average score</div>
          <div className="big">{average ?? "-"}</div>
        </div>
        <div className="card">
          <div className="metric">Critical alerts</div>
          <div className="big">{critical}</div>
        </div>
        <div className="card">
          <div className="metric">Audits</div>
          <div className="big">{audits.length}</div>
        </div>
      </div>
      <div style={{ height: 18 }} />
      <div className="grid cols-2">
        <div className="card">
          <div className="actions" style={{ justifyContent: "space-between" }}>
            <h2>Websites needing attention</h2>
            <Link className="button" href="/websites">
              View all
            </Link>
          </div>
          <table className="table">
            <tbody>
              {websites.slice(0, 6).map((website) => {
                const latest = latestAuditFor(website, audits);
                return (
                  <tr key={website.id}>
                    <td>
                      <Link href={`/websites/${website.id}`}>
                        <strong>{website.displayName}</strong>
                        <div className="muted">{website.domain}</div>
                      </Link>
                    </td>
                    <td>{latest ? <ScoreText score={latest.overallScore} /> : <span className="muted">No audit</span>}</td>
                    <td>{latest ? timeAgo(latest.completedAt ?? latest.createdAt) : <RunAuditButton websiteId={website.id} />}</td>
                  </tr>
                );
              })}
              {websites.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No websites added yet. Add your first website and run a clean audit in minutes.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <AddWebsiteForm />
      </div>
    </AppShell>
  );
}
