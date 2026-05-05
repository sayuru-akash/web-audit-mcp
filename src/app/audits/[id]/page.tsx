import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ShareButtons } from "@/components/forms";
import { ScoreRing, ScoreText } from "@/components/score";
import { requireUser } from "@/lib/auth";
import { absoluteUrl, timeAgo } from "@/lib/format";
import { activeShareFor, findingsFor, getUserDashboard, metricsFor } from "@/lib/store";

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { data, websites, audits } = await getUserDashboard(user.id);
  const audit = audits.find((item) => item.id === id);
  if (!audit) notFound();
  const website = websites.find((item) => item.id === audit.websiteId);
  if (!website) notFound();
  const findings = findingsFor(audit.id, data.findings);
  const metrics = metricsFor(audit.id, data.metrics);
  const share = activeShareFor(audit.id, data.shareLinks);
  const topIssues = findings.filter((finding) => finding.status === "failed").slice(0, 8);
  return (
    <AppShell user={user} title="Audit report" subtitle={`${website.displayName} - ${audit.finalUrl ?? audit.requestedUrl}`}>
      <div className="actions">
        <Link className="button" href={`/api/audits/${audit.id}/pdf`}>
          Export PDF
        </Link>
        <ShareButtons auditId={audit.id} enabled={Boolean(share)} />
        {share ? (
          <Link className="button" href={`/share/${share.token}`}>
            Shared report
          </Link>
        ) : null}
      </div>
      <div style={{ height: 18 }} />
      <div className="grid cols-3">
        <div className="card">
          <ScoreRing score={audit.overallScore} />
          <h2>{audit.overallScore ? "Overall health" : "Audit status"}</h2>
          <p className="muted">
            {audit.status === "failed"
              ? audit.failureReason
              : `Completed ${timeAgo(audit.completedAt ?? audit.createdAt)}. Share URL: ${share ? absoluteUrl(`/share/${share.token}`) : "private"}`}
          </p>
        </div>
        <div className="card">
          <h2>Category scores</h2>
          <div className="grid">
            {audit.categoryScores
              ? Object.entries(audit.categoryScores).map(([category, score]) => (
                  <div className="actions" style={{ justifyContent: "space-between" }} key={category}>
                    <span>{category}</span>
                    <ScoreText score={score} />
                  </div>
                ))
              : null}
          </div>
        </div>
        <div className="card">
          <h2>Audit details</h2>
          <p className="muted">Profile: {audit.profile}</p>
          <p className="muted">Duration: {audit.durationMs ? Math.round(audit.durationMs / 1000) : "-"}s</p>
          <p className="muted">Status: {audit.status}</p>
        </div>
      </div>
      <div style={{ height: 18 }} />
      <div className="grid cols-2">
        <div className="card">
          <h2>Top issues</h2>
          <div className="grid">
            {topIssues.map((finding) => (
              <article className="issue card" key={finding.id}>
                <div>
                  <span className={`badge ${finding.severity}`}>{finding.severity}</span>
                </div>
                <h3>{finding.title}</h3>
                <p>{finding.description}</p>
                <p>
                  <strong>Fix:</strong> {finding.recommendation}
                </p>
                <details>
                  <summary>Evidence</summary>
                  <p>{finding.evidence}</p>
                  {finding.technicalDetails ? <pre>{finding.technicalDetails}</pre> : null}
                </details>
              </article>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Metrics</h2>
          <table className="table">
            <tbody>
              {metrics.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>
                    {item.value}
                    {item.unit ? ` ${item.unit}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ height: 18 }} />
      <div className="card">
        <h2>All findings</h2>
        <table className="table">
          <tbody>
            {findings.map((finding) => (
              <tr key={finding.id}>
                <td>
                  <span className={`badge ${finding.severity}`}>{finding.severity}</span>
                </td>
                <td>
                  <strong>{finding.title}</strong>
                  <div className="muted">{finding.impact}</div>
                </td>
                <td>{finding.category}</td>
                <td>
                  <span className={`badge ${finding.status}`}>{finding.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
