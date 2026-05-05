import PDFDocument from "pdfkit";
import type { AuditRun, Finding, Metric, Website } from "@/lib/types";
import { scoreLabel } from "@/lib/scoring";

export async function buildAuditPdf({
  website,
  audit,
  findings,
  metrics,
}: {
  website: Website;
  audit: AuditRun;
  findings: Finding[];
  metrics: Metric[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Web Audit - ${website.displayName}` } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#111827").fontSize(22).text("Web Audit", { continued: true });
    doc.fillColor("#6b7280").fontSize(10).text("  Page audit with selected website health checks");
    doc.moveDown();
    doc.fillColor("#111827").fontSize(18).text(website.displayName);
    doc.fillColor("#4b5563").fontSize(10).text(audit.finalUrl ?? audit.requestedUrl);
    doc.moveDown();
    doc.fillColor("#111827").fontSize(42).text(String(audit.overallScore ?? "-"), { continued: true });
    doc.fillColor("#6b7280").fontSize(14).text(` / 100  ${scoreLabel(audit.overallScore)}`);
    doc.moveDown();

    if (audit.categoryScores) {
      doc.fontSize(13).fillColor("#111827").text("Category scores");
      for (const [category, score] of Object.entries(audit.categoryScores)) {
        doc.fillColor("#374151").fontSize(10).text(`${category}: ${score}/100`);
      }
      doc.moveDown();
    }

    doc.fillColor("#111827").fontSize(13).text("Top findings");
    findings
      .filter((finding) => finding.status === "failed")
      .slice(0, 12)
      .forEach((finding) => {
        doc.moveDown(0.4);
        doc.fillColor("#111827").fontSize(11).text(`${finding.severity.toUpperCase()} - ${finding.title}`);
        doc.fillColor("#4b5563").fontSize(9).text(finding.description);
        doc.fillColor("#111827").fontSize(9).text(`Fix: ${finding.recommendation}`);
      });

    doc.addPage();
    doc.fillColor("#111827").fontSize(13).text("Metrics");
    metrics.forEach((item) => {
      doc.fillColor("#374151").fontSize(10).text(`${item.label}: ${item.value}${item.unit ? ` ${item.unit}` : ""}`);
    });
    doc.moveDown();
    doc.fillColor("#6b7280").fontSize(9).text(
      "Automated audits are a strong first pass, but they do not replace manual performance, accessibility, security, or SEO review.",
    );
    doc.end();
  });
}
