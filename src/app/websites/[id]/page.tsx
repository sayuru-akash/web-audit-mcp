import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DeleteWebsiteForm, EditWebsiteForm, RunAuditButton, ScheduleForm } from "@/components/forms";
import { ScoreText } from "@/components/score";
import { requireUser } from "@/lib/auth";
import { storeAdapter } from "@/lib/persistence";
import { findingsFor, latestAuditFor } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Website Detail",
  ...noIndexMetadata,
};

export default async function WebsiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { data, websites, audits } = await storeAdapter.getUserDashboard(user.id);
  const website = websites.find((item) => item.id === id);
  if (!website) notFound();
  const websiteAudits = audits.filter((audit) => audit.websiteId === website.id);
  const latest = latestAuditFor(website, audits);
  const findings = latest ? (await storeAdapter.getAuditReport(latest.id, user.id)).findings.filter((finding) => finding.status === "failed") : [];
  return (
    <AppShell user={user} title={website.displayName} subtitle={website.normalizedUrl}>
      <div className="actions">
        <RunAuditButton websiteId={website.id} />
        {latest ? (
          <Link className="button" href={`/audits/${latest.id}`}>
            Open latest report
          </Link>
        ) : null}
      </div>
      <div style={{ height: 18 }} />
      <div className="grid cols-3">
        <div className="card">
          <div className="metric">Latest score</div>
          <div className="big">{latest?.overallScore ?? "-"}</div>
          <p className="muted">{latest ? timeAgo(latest.completedAt ?? latest.createdAt) : "No audits yet"}</p>
        </div>
        <div className="card">
          <div className="metric">High priority findings</div>
          <div className="big">{findings.filter((finding) => ["critical", "high"].includes(finding.severity)).length}</div>
        </div>
        <div className="card">
          <div className="metric">Schedule</div>
          <div className="big" style={{ fontSize: 24 }}>
            {website.scheduleEnabled ? website.scheduleFrequency : "Manual"}
          </div>
          <p className="muted">Next run: {website.nextScheduledRunAt ? timeAgo(website.nextScheduledRunAt) : "Not scheduled"}</p>
        </div>
      </div>
      <div style={{ height: 18 }} />
      <div className="grid cols-2">
        <div className="card">
          <h2>Audit history</h2>
          <table className="table">
            <tbody>
              {websiteAudits.map((audit) => (
                <tr key={audit.id}>
                  <td>
                    <Link href={`/audits/${audit.id}`}>{timeAgo(audit.completedAt ?? audit.createdAt)}</Link>
                  </td>
                  <td>
                    <span className={`badge ${audit.status}`}>{audit.status}</span>
                  </td>
                  <td>
                    <ScoreText score={audit.overallScore} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid">
          <ScheduleForm websiteId={website.id} frequency={website.scheduleFrequency} threshold={website.alertThreshold} />
          <EditWebsiteForm websiteId={website.id} displayName={website.displayName} />
          <DeleteWebsiteForm websiteId={website.id} />
        </div>
      </div>
    </AppShell>
  );
}
