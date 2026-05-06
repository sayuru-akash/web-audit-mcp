import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Globe2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AddWebsiteForm, RunAuditButton } from "@/components/forms";
import { ScoreText } from "@/components/score";
import { requireUser } from "@/lib/auth";
import { storeAdapter } from "@/lib/persistence";
import { latestAuditFor } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Dashboard",
  ...noIndexMetadata,
};

export default async function DashboardPage() {
  const user = await requireUser();
  const { websites, audits, notifications } =
    await storeAdapter.getUserDashboard(user.id);
  const completed = audits.filter(
    (audit) => audit.status === "completed" && audit.overallScore !== undefined,
  );
  const average = completed.length
    ? Math.round(
        completed.reduce((sum, audit) => sum + (audit.overallScore ?? 0), 0) /
          completed.length,
      )
    : undefined;
  const critical = notifications.filter(
    (notification) =>
      notification.type === "critical_issue" && !notification.read,
  ).length;
  const latestCompleted = [...completed].sort(
    (a, b) =>
      Date.parse(b.completedAt ?? b.createdAt) -
      Date.parse(a.completedAt ?? a.createdAt),
  )[0];
  const websiteSummaries = websites
    .map((website) => ({ website, latest: latestAuditFor(website, audits) }))
    .sort((a, b) => {
      const aScore = a.latest?.overallScore ?? -1;
      const bScore = b.latest?.overallScore ?? -1;
      return aScore - bScore;
    });
  const recentAudits = [...audits]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5);
  return (
    <AppShell user={user} title="Dashboard" subtitle="Live overview">
      <div className="dashboard-shell">
        <div className="dashboard-main-stack">
          <section className="dashboard-hero">
            <div>
              <span className="eyebrow">Workspace health</span>
              <h2>
                {average !== undefined ? `${average}/100` : "No score yet"}
              </h2>
              <p>
                {latestCompleted
                  ? `Last audit ${timeAgo(latestCompleted.completedAt ?? latestCompleted.createdAt)}`
                  : "Add a site to begin."}
              </p>
            </div>
            <div className="hero-actions">
              <span className="status-pill">
                {critical ? `${critical} critical` : "No critical alerts"}
              </span>
              <Link className="button primary" href="/websites">
                Websites <ArrowUpRight size={16} />
              </Link>
            </div>
          </section>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">
                <Globe2 size={18} />
              </span>
              <div>
                <div className="metric">Websites</div>
                <div className="big">{websites.length}</div>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">
                <BarChart3 size={18} />
              </span>
              <div>
                <div className="metric">Average score</div>
                <div className="big">{average ?? "-"}</div>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon warning">
                <AlertTriangle size={18} />
              </span>
              <div>
                <div className="metric">Critical alerts</div>
                <div className="big">{critical}</div>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">
                <Activity size={18} />
              </span>
              <div>
                <div className="metric">Audits</div>
                <div className="big">{audits.length}</div>
              </div>
            </div>
          </div>
          <div className="dashboard-panels">
            <div className="card panel-card">
              <div
                className="actions"
                style={{ justifyContent: "space-between" }}
              >
                <h2>Needs attention</h2>
                <Link className="button" href="/websites">
                  View all
                </Link>
              </div>
              <div className="attention-list">
                {websiteSummaries.slice(0, 6).map(({ website, latest }) => (
                  <article className="attention-row" key={website.id}>
                    <Link href={`/websites/${website.id}`}>
                      <strong>{website.displayName}</strong>
                      <span>{website.domain}</span>
                    </Link>
                    <div>
                      {latest ? (
                        <ScoreText score={latest.overallScore} />
                      ) : (
                        <RunAuditButton websiteId={website.id} />
                      )}
                    </div>
                    <span className="muted">
                      {latest
                        ? timeAgo(latest.completedAt ?? latest.createdAt)
                        : "Not run"}
                    </span>
                  </article>
                ))}
                {websites.length === 0 ? (
                  <p className="empty-state">No websites yet.</p>
                ) : null}
              </div>
            </div>
            <div className="card panel-card">
              <div
                className="actions"
                style={{ justifyContent: "space-between" }}
              >
                <h2>Recent audits</h2>
                <Link className="button" href="/audits">
                  View all
                </Link>
              </div>
              <div className="recent-list">
                {recentAudits.map((audit) => {
                  const website = websites.find(
                    (item) => item.id === audit.websiteId,
                  );
                  return (
                    <Link
                      className="recent-row"
                      href={`/audits/${audit.id}`}
                      key={audit.id}
                    >
                      <span>
                        <strong>
                          {website?.displayName ?? audit.requestedUrl}
                        </strong>
                        <small>
                          {timeAgo(audit.completedAt ?? audit.createdAt)}
                        </small>
                      </span>
                      <span className={`badge ${audit.status}`}>
                        {audit.status}
                      </span>
                      <ScoreText score={audit.overallScore} />
                    </Link>
                  );
                })}
                {recentAudits.length === 0 ? (
                  <p className="empty-state">No audits yet.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <AddWebsiteForm
          className="form card quick-add-card"
          heading="Add website"
        />
      </div>
    </AppShell>
  );
}
