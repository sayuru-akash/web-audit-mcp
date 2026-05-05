import { NextResponse } from "next/server";
import { dueScheduledWebsites, processQueuedAudits, recoverStaleAudits, runAuditForWebsite } from "@/lib/audit-service";
import { checkRateLimit, pruneExpiredSecurityRecords } from "@/lib/store";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const allowed = await checkRateLimit("cron:run-scheduled", 30, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Cron rate limit reached." }, { status: 429 });
  await pruneExpiredSecurityRecords();
  const recoveredStale = await recoverStaleAudits();
  const due = await dueScheduledWebsites();
  const results = [];
  for (const website of due) {
    results.push(await runAuditForWebsite(website.userId, website.id, "scheduled"));
  }
  const queued = await processQueuedAudits(5);
  return NextResponse.json({
    scheduled: results.length,
    processedQueued: queued.length,
    recoveredStale,
    audits: [...results, ...queued].map((audit) => audit.id),
  });
}
