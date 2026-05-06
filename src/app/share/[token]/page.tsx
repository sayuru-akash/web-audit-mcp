import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FindingEvidenceButton } from "@/components/finding-evidence";
import { ScoreRing } from "@/components/score";
import { storeAdapter } from "@/lib/persistence";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Shared Audit Report",
  description: "Private shared Web Audit report.",
  ...noIndexMetadata,
};

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { website, audit, findings, metrics } = await storeAdapter.getSharedAuditReport(token);
  if (!audit) notFound();
  if (!website) notFound();
  const failedFindings = findings.filter((finding) => finding.status === "failed");
  const reviewFindings = findings.filter((finding) => finding.status === "needs_review");
  return (
    <main className="content" style={{ margin: "0 auto" }}>
      <div className="card">
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 className="page-title">Web Audit Report</h1>
            <p className="page-subtitle">{website.displayName} - {audit.finalUrl}</p>
          </div>
          <ScoreRing score={audit.overallScore} />
        </div>
      </div>
      <div style={{ height: 18 }} />
      <div className="grid cols-2">
        <div className="card">
          <h2>Findings</h2>
          <div className="grid">
            {failedFindings.length > 0 ? (
              failedFindings.slice(0, 12).map((finding) => (
                <article className="issue" key={finding.id}>
                  <span className={`badge ${finding.severity}`}>{finding.severity}</span>
                  <h3>{finding.title}</h3>
                  <p>{finding.recommendation}</p>
                  <FindingEvidenceButton finding={finding} />
                </article>
              ))
            ) : (
              <p className="muted">No confirmed failed findings in this shared report.</p>
            )}
          </div>
          {reviewFindings.length > 0 ? (
            <>
              <div style={{ height: 16 }} />
              <h2>Manual review</h2>
              <div className="grid">
                {reviewFindings.slice(0, 8).map((finding) => (
                  <article className="issue" key={finding.id}>
                    <span className="badge needs_review">manual review</span>
                    <h3>{finding.title}</h3>
                    <p>{finding.recommendation}</p>
                    <FindingEvidenceButton finding={finding} />
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <div className="card">
          <h2>Metrics</h2>
          <div className="grid">
            <div className="actions" style={{ justifyContent: "space-between" }}>
              <span>Confirmed failures</span>
              <strong>{failedFindings.length}</strong>
            </div>
            <div className="actions" style={{ justifyContent: "space-between" }}>
              <span>Manual review</span>
              <strong>{reviewFindings.length}</strong>
            </div>
          </div>
          <div style={{ height: 16 }} />
          <table className="table">
            <tbody>
              {metrics.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{item.value}{item.unit ? ` ${item.unit}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
