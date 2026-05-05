import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildAuditPdf } from "@/lib/pdf";
import { findingsFor, metricsFor, readStore } from "@/lib/store";

export const runtime = "nodejs";

function pdfFilename(domain: string) {
  const safe = domain.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "") || "report";
  return `web-audit-${safe}.pdf`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const data = await readStore();
  const audit = data.audits.find((item) => item.id === id && item.userId === user.id && item.status === "completed");
  if (!audit) return NextResponse.json({ error: "Completed audit not found." }, { status: 404 });
  const website = data.websites.find((item) => item.id === audit.websiteId && item.userId === user.id);
  if (!website) return NextResponse.json({ error: "Website not found." }, { status: 404 });
  const pdf = await buildAuditPdf({
    website,
    audit,
    findings: findingsFor(audit.id, data.findings),
    metrics: metricsFor(audit.id, data.metrics),
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-length": String(pdf.byteLength),
      "content-disposition": `attachment; filename="${pdfFilename(website.domain)}"`,
    },
  });
}
