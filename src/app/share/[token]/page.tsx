import { notFound } from "next/navigation";
import { ScoreRing } from "@/components/score";
import { activeShareFor, findingsFor, metricsFor, readStore } from "@/lib/store";

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await readStore();
  const tokenMatch = data.shareLinks.find((item) => item.token === token);
  const link = tokenMatch ? activeShareFor(tokenMatch.auditRunId, data.shareLinks) : undefined;
  if (!link) notFound();
  const audit = data.audits.find((item) => item.id === link.auditRunId && item.status === "completed");
  if (!audit) notFound();
  const website = data.websites.find((item) => item.id === audit.websiteId);
  if (!website) notFound();
  const findings = findingsFor(audit.id, data.findings);
  const metrics = metricsFor(audit.id, data.metrics);
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
            {findings.filter((finding) => finding.status === "failed").slice(0, 12).map((finding) => (
              <article className="issue" key={finding.id}>
                <span className={`badge ${finding.severity}`}>{finding.severity}</span>
                <h3>{finding.title}</h3>
                <p>{finding.recommendation}</p>
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
