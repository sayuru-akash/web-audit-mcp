import {
  addWebsiteForUser,
  createOrToggleShare,
  deleteAccountForUser,
  runAuditForWebsite,
  updateSchedule,
} from "@/lib/audit-service";
import { closeDatabase } from "@/db/client";
import { storeAdapter } from "@/lib/persistence";
import { id, nowIso } from "@/lib/store";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const targetUrl =
  process.argv.find((arg) => arg.startsWith("http")) ??
  "https://www.wikipedia.org/";
const keep = process.argv.includes("--keep");

if (process.env.WEB_AUDIT_STORE !== "postgres") {
  throw new Error("Set WEB_AUDIT_STORE=postgres before running db:smoke.");
}

if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL before running db:smoke.");
}

assert(storeAdapter.provider === "postgres", "Postgres adapter is not active.");

const ts = nowIso();
const userId = id();
const email = `smoke-${Date.now()}@webaudit.local`;
let shareUrl: string | undefined;

try {
  await storeAdapter.createUser({
    id: userId,
    email,
    passwordHash: "smoke-only",
    displayName: "Postgres Smoke",
    notifyOnAuditCompleted: true,
    notifyOnAuditFailed: true,
    notifyOnCriticalIssue: true,
    notifyOnScoreDrop: true,
    createdAt: ts,
    updatedAt: ts,
  });

  const website = await addWebsiteForUser(userId, targetUrl, "Smoke target");
  assert(website.id, "Website was not created.");

  await updateSchedule(userId, website.id, "weekly", 12);
  await updateSchedule(userId, website.id, "manual", 12);

  const audit = await runAuditForWebsite(userId, website.id);
  assert(audit.status === "completed", `Audit did not complete: ${audit.status}`);
  assert(
    typeof audit.overallScore === "number",
    "Completed audit has no overall score.",
  );

  const report = await storeAdapter.getAuditReport(audit.id, userId);
  assert(report.website?.id === website.id, "Report website lookup failed.");
  assert(report.audit?.id === audit.id, "Report audit lookup failed.");
  assert(report.findings.length > 0, "Report has no persisted findings.");
  assert(report.metrics.length > 0, "Report has no persisted metrics.");

  const share = await createOrToggleShare(userId, audit.id, true);
  const shared = await storeAdapter.getSharedAuditReport(share.token);
  assert(shared.audit?.id === audit.id, "Shared report lookup failed.");
  assert(shared.findings.length === report.findings.length, "Shared findings mismatch.");

  await storeAdapter.markNotificationsRead(userId);

  shareUrl = `/share/${share.token}`;
  console.log(
    JSON.stringify(
      {
        ok: true,
        provider: storeAdapter.provider,
        targetUrl,
        userId,
        websiteId: website.id,
        auditId: audit.id,
        score: audit.overallScore,
        findings: report.findings.length,
        metrics: report.metrics.length,
        shareUrl,
        kept: keep,
      },
      null,
      2,
    ),
  );
} finally {
  if (!keep) {
    await deleteAccountForUser(userId).catch(() => undefined);
  }
  await closeDatabase();
}
