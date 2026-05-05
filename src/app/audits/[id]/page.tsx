import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuditStatusRefresh } from "@/components/audit-status-refresh";
import { FindingEvidenceButton } from "@/components/finding-evidence";
import { ReportActions } from "@/components/report-actions";
import { ScoreRing, ScoreText } from "@/components/score";
import { requireUser } from "@/lib/auth";
import { absoluteUrlFromOrigin, requestOrigin, timeAgo } from "@/lib/format";
import { noIndexMetadata } from "@/lib/seo";
import { activeShareFor, findingsFor, getUserDashboard, metricsFor } from "@/lib/store";

export const metadata: Metadata = {
  title: "Audit Report",
  ...noIndexMetadata,
};

export default async function AuditReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ share?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const { data, websites, audits } = await getUserDashboard(user.id);
  const audit = audits.find((item) => item.id === id);
  if (!audit) notFound();
  const website = websites.find((item) => item.id === audit.websiteId);
  if (!website) notFound();
  const findings = findingsFor(audit.id, data.findings);
  const metrics = metricsFor(audit.id, data.metrics);
  const share = activeShareFor(audit.id, data.shareLinks);
  const origin = requestOrigin(await headers());
  const shareUrl = share ? absoluteUrlFromOrigin(`/share/${share.token}`, origin) : undefined;
  const confirmedFindings = findings.filter((finding) => finding.status === "failed");
  const passedFindings = findings.filter((finding) => finding.status === "passed");
  const topIssues = confirmedFindings.slice(0, 8);
  const manualReviewFindings = findings.filter((finding) => finding.status === "needs_review");
  return (
    <AppShell user={user} title="Audit report" subtitle={`${website.displayName} - ${audit.finalUrl ?? audit.requestedUrl}`}>
      <div className="report-toolbar">
        {audit.status === "completed" ? (
          <ReportActions auditId={audit.id} websiteDomain={website.domain} shareUrl={shareUrl} shareCreated={query.share === "created"} />
        ) : (
          <span className="inline-status">Report actions unlock after completion.</span>
        )}
        {share ? (
          <Link className="button" href={`/share/${share.token}`}>
            Shared report
          </Link>
        ) : null}
      </div>
      <div style={{ height: 18 }} />
      {audit.status === "queued" || audit.status === "running" ? (
        <>
          <AuditStatusRefresh status={audit.status} />
          <div style={{ height: 18 }} />
        </>
      ) : null}
      <div className="report-summary">
        <div className="card score-card">
          <ScoreRing score={audit.overallScore} />
          <div>
            <h2>{audit.overallScore ? "Overall health" : "Audit status"}</h2>
            <p className="muted">{audit.status === "failed" ? audit.failureReason : `Completed ${timeAgo(audit.completedAt ?? audit.createdAt)}`}</p>
          </div>
        </div>
        <div className="card score-breakdown">
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
        <div className="card classification-card">
          <h2>Classification</h2>
          <div className="classification-grid">
            <div>
              <span>Failed</span>
              <strong>{confirmedFindings.length}</strong>
            </div>
            <div>
              <span>Review</span>
              <strong>{manualReviewFindings.length}</strong>
            </div>
            <div>
              <span>Passed</span>
              <strong>{passedFindings.length}</strong>
            </div>
          </div>
          <div className="mini-meta">
            <span>{audit.profile}</span>
            <span>{audit.durationMs ? `${Math.round(audit.durationMs / 1000)}s` : "-s"}</span>
            <span>{audit.status}</span>
          </div>
        </div>
      </div>
      <div style={{ height: 18 }} />
      <div className="report-layout">
        <div className="card panel-card">
          <h2>Top issues</h2>
          <div className="issue-list">
            {topIssues.length > 0 ? (
              topIssues.slice(0, 6).map((finding) => (
                <article className="issue-row" key={finding.id}>
                  <div className="actions">
                    <span className={`badge ${finding.severity}`}>{finding.severity}</span>
                    <span className={`badge ${finding.status}`}>{finding.status.replace("_", " ")}</span>
                  </div>
                  <div>
                    <h3>{finding.title}</h3>
                    <p>{finding.recommendation}</p>
                  </div>
                  <FindingEvidenceButton finding={finding} />
                </article>
              ))
            ) : (
              <p className="muted">No confirmed failed findings in this audit.</p>
            )}
          </div>
        </div>
        <div className="card panel-card">
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
      {manualReviewFindings.length > 0 ? (
        <>
          <div style={{ height: 18 }} />
          <div className="card">
            <h2>Needs manual verification</h2>
            <p className="muted">
              These items were detected by automation but may be platform-managed or conditional. They are visible in the report without reducing the score.
            </p>
            <div className="grid">
              {manualReviewFindings.map((finding) => (
                <article className="issue" key={finding.id}>
                  <div className="actions">
                    <span className={`badge ${finding.severity}`}>{finding.severity}</span>
                    <span className={`badge ${finding.status}`}>manual review</span>
                  </div>
                  <h3>{finding.title}</h3>
                  <p>{finding.recommendation}</p>
                  <FindingEvidenceButton finding={finding} />
                </article>
              ))}
            </div>
          </div>
        </>
      ) : null}
      <div style={{ height: 18 }} />
      <div className="card panel-card">
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
                  <span className={`badge ${finding.status}`}>{finding.status.replace("_", " ")}</span>
                </td>
                <td>
                  <FindingEvidenceButton finding={finding} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
