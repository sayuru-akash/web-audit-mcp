import Link from "next/link";
import type { Metadata } from "next";
import { ScoreRing } from "@/components/score";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Sample Website Audit Report",
  "Preview Web Audit's report format with category scores, metrics, and prioritized findings.",
  "/sample-report",
);

export default function SampleReportPage() {
  return (
    <main className="content" style={{ margin: "0 auto" }}>
      <div className="card">
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 className="page-title">Sample Web Audit Report</h1>
            <p className="page-subtitle">A compact preview of the report style.</p>
          </div>
          <ScoreRing score={82} />
        </div>
      </div>
      <div style={{ height: 18 }} />
      <div className="grid cols-3">
        {["Performance 76", "SEO 88", "Accessibility 84", "Security 71", "Technical 90", "Mobile 83"].map((item) => (
          <div className="card" key={item}>{item}</div>
        ))}
      </div>
      <div style={{ height: 18 }} />
      <div className="card">
        <h2>Top issues</h2>
        <div className="grid">
          {[
            ["high", "Initial response is slow", "Review backend latency, caching, and CDN configuration."],
            ["medium", "Content Security Policy is missing", "Add a CSP and test it in report-only mode first."],
            ["medium", "Images are missing alternative text", "Add alt text for meaningful images."],
          ].map(([severity, title, fix]) => (
            <article className="issue" key={title}>
              <span className={`badge ${severity}`}>{severity}</span>
              <h3>{title}</h3>
              <p>{fix}</p>
            </article>
          ))}
        </div>
      </div>
      <p>
        <Link className="button primary" href="/signup">Run your own audit</Link>
      </p>
    </main>
  );
}
