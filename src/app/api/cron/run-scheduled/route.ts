import { NextResponse } from "next/server";
import { dueScheduledWebsites, runAuditForWebsite } from "@/lib/audit-service";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const due = await dueScheduledWebsites();
  const results = [];
  for (const website of due) {
    results.push(await runAuditForWebsite(website.userId, website.id));
  }
  return NextResponse.json({ queued: results.length, audits: results.map((audit) => audit.id) });
}
