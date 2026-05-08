import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildAuditPdf } from "@/lib/pdf";
import { storeAdapter } from "@/lib/persistence";

export const runtime = "nodejs";

function pdfFilename(domain: string) {
  const safe =
    domain
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "report";
  return `web-audit-${safe}.pdf`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const { website, audit, findings, metrics } =
    await storeAdapter.getAuditReport(id, user.id);
  if (!audit)
    return NextResponse.json(
      { error: "Completed audit not found." },
      { status: 404 },
    );
  if (!website)
    return NextResponse.json({ error: "Website not found." }, { status: 404 });
  const pdf = await buildAuditPdf({
    website,
    audit,
    findings,
    metrics,
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-length": String(pdf.byteLength),
      "content-disposition": `attachment; filename="${pdfFilename(website.domain)}"`,
    },
  });
}
