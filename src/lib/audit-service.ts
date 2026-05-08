import { id, nowIso } from "@/lib/store";
import { storeAdapter } from "@/lib/persistence";
import type {
  AuditRun,
  ScheduleFrequency,
  ShareLink,
  Website,
} from "@/lib/types";
import { runPageAudit } from "@/lib/audit-engine";
import { normalizeWebsiteUrl } from "@/lib/url";

export async function addWebsiteForUser(
  userId: string,
  url: string,
  displayName?: string,
): Promise<Website> {
  const normalized = normalizeWebsiteUrl(url);
  const allowed = await storeAdapter.checkRateLimit(
    `add-website:${userId}`,
    20,
    60 * 60 * 1000,
  );
  if (!allowed)
    throw new Error("Too many website changes. Please try again later.");
  const existing = (await storeAdapter.getWebsitesByUser(userId)).find(
    (site: Website) => site.normalizedUrl === normalized.normalizedUrl,
  );
  if (existing) return existing;
  if ((await storeAdapter.getWebsitesByUser(userId)).length >= 50) {
    throw new Error("Website limit reached for this account.");
  }
  const ts = nowIso();
  return storeAdapter.createWebsite({
    id: id(),
    userId,
    displayName: displayName?.trim() || normalized.domain,
    originalUrl: normalized.originalUrl,
    normalizedUrl: normalized.normalizedUrl,
    domain: normalized.domain,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(normalized.domain)}&sz=64`,
    scheduleFrequency: "manual",
    scheduleEnabled: false,
    alertThreshold: 10,
    createdAt: ts,
    updatedAt: ts,
  });
}

const STALE_AUDIT_MS = 30 * 60 * 1000;

async function createNotificationForUser(
  notification: Omit<import("@/lib/types").Notification, "id" | "createdAt" | "read">,
) {
  const data = await storeAdapter.readStore();
  const user = data.users.find((item) => item.id === notification.userId);
  const enabled = {
    audit_completed: user?.notifyOnAuditCompleted ?? true,
    scheduled_completed: user?.notifyOnAuditCompleted ?? true,
    audit_failed: user?.notifyOnAuditFailed ?? true,
    critical_issue: user?.notifyOnCriticalIssue ?? true,
    score_dropped: user?.notifyOnScoreDrop ?? true,
  }[notification.type];
  if (!enabled) return undefined;
  return storeAdapter.createNotification({
    ...notification,
    id: id(),
    read: false,
    createdAt: nowIso(),
  });
}

function nextRunAt(
  frequency: ScheduleFrequency,
  from = new Date(),
): string | undefined {
  if (frequency === "manual") return undefined;
  const date = new Date(from);
  if (frequency === "daily") date.setDate(date.getDate() + 1);
  if (frequency === "weekly") date.setDate(date.getDate() + 7);
  if (frequency === "monthly") date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export async function runAuditForWebsite(
  userId: string,
  websiteId: string,
  source: "manual" | "scheduled" = "manual",
): Promise<AuditRun> {
  const canRun = await storeAdapter.checkRateLimit(
    `audit-user:${userId}`,
    12,
    60 * 60 * 1000,
  );
  if (!canRun) throw new Error("Audit limit reached. Please try again later.");
  const website = await storeAdapter.getWebsiteById(websiteId, userId);
  if (!website) throw new Error("Website not found.");
  const duplicate = await storeAdapter.findActiveAuditForWebsite(websiteId);
  if (duplicate) return duplicate;
  const ts = nowIso();
  const audit = await storeAdapter.createAuditRun({
    id: id(),
    websiteId,
    userId,
    status: "queued",
    requestedUrl: website.normalizedUrl,
    profile: "desktop",
    createdAt: ts,
    updatedAt: ts,
  });
  if (audit.status !== "queued") return audit;
  return processAudit(audit.id, source);
}

export async function processAudit(
  auditId: string,
  source: "manual" | "scheduled" = "manual",
): Promise<AuditRun> {
  const startedAt = nowIso();
  await storeAdapter.updateAuditRun(auditId, {
    status: "running",
    startedAt,
    updatedAt: startedAt,
  });

  const audit = await storeAdapter.getAuditById(auditId);
  if (!audit) throw new Error("Audit not found.");
  try {
    const result = await runPageAudit(audit.requestedUrl);
    const completedAt = nowIso();
    const website = await storeAdapter.getWebsiteById(audit.websiteId);
    const previousCompleted =
      await storeAdapter.getLatestCompletedAuditForWebsite(
        audit.websiteId,
        audit.id,
      );
    const nextFindings = result.findings.map((finding) => ({
      ...finding,
      id: id(),
      auditRunId: auditId,
    }));
    const nextMetrics = result.metrics.map((metric) => ({
      ...metric,
      id: id(),
      auditRunId: auditId,
    }));
    const current = await storeAdapter.updateAuditRun(auditId, {
      status: "completed",
      finalUrl: result.finalUrl,
      completedAt,
      durationMs: Date.parse(completedAt) - Date.parse(startedAt),
      overallScore: result.overallScore,
      categoryScores: result.categoryScores,
      updatedAt: completedAt,
    });
    await storeAdapter.replaceAuditResults(auditId, nextFindings, nextMetrics);
    if (website) {
      await storeAdapter.updateWebsite(website.id, {
        lastAuditId: auditId,
        lastScheduledRunAt:
          source === "scheduled" ? completedAt : website.lastScheduledRunAt,
        nextScheduledRunAt:
          source === "scheduled"
            ? nextRunAt(website.scheduleFrequency, new Date(completedAt))
            : website.nextScheduledRunAt,
        updatedAt: completedAt,
      });
    }
    await createNotificationForUser({
      userId: current.userId,
      websiteId: current.websiteId,
      auditRunId: current.id,
      type: "audit_completed",
      title: "Audit completed",
      message: `${website?.displayName ?? "Website"} scored ${result.overallScore}.`,
    });
    if (source === "scheduled") {
      await createNotificationForUser({
        userId: current.userId,
        websiteId: current.websiteId,
        auditRunId: current.id,
        type: "scheduled_completed",
        title: "Scheduled audit completed",
        message: `${website?.displayName ?? "Website"} finished its scheduled audit.`,
      });
    }
    if (
      nextFindings.some(
        (finding) =>
          finding.status === "failed" && finding.severity === "critical",
      )
    ) {
      await createNotificationForUser({
        userId: current.userId,
        websiteId: current.websiteId,
        auditRunId: current.id,
        type: "critical_issue",
        title: "Critical issue found",
        message: "A critical issue was found in the latest audit.",
      });
    }
    if (
      previousCompleted?.overallScore !== undefined &&
      previousCompleted.overallScore - result.overallScore >=
        (website?.alertThreshold ?? 10)
    ) {
      await createNotificationForUser({
        userId: current.userId,
        websiteId: current.websiteId,
        auditRunId: current.id,
        type: "score_dropped",
        title: "Score dropped",
        message: `Overall score dropped from ${previousCompleted.overallScore} to ${result.overallScore}.`,
      });
    }
    return current;
  } catch (error) {
    const completedAt = nowIso();
    const current = await storeAdapter.updateAuditRun(auditId, {
      status: "failed",
      failureReason:
        error instanceof Error
          ? error.message
          : "The audit failed unexpectedly.",
      completedAt,
      updatedAt: completedAt,
    });
    const website = await storeAdapter.getWebsiteById(current.websiteId);
    if (source === "scheduled" && website) {
      await storeAdapter.updateWebsite(website.id, {
        lastScheduledRunAt: completedAt,
        nextScheduledRunAt: nextRunAt(
          website.scheduleFrequency,
          new Date(completedAt),
        ),
        updatedAt: completedAt,
      });
    }
    await createNotificationForUser({
      userId: current.userId,
      websiteId: current.websiteId,
      auditRunId: current.id,
      type: "audit_failed",
      title: "Audit failed",
      message:
        "We could not complete this audit. Please retry after checking the URL.",
    });
    return current;
  }
}

export async function processQueuedAudits(limit = 3): Promise<AuditRun[]> {
  await recoverStaleAudits();
  const queued = await storeAdapter.listQueuedAudits(limit);
  const processed: AuditRun[] = [];
  for (const audit of queued) {
    processed.push(await processAudit(audit.id));
  }
  return processed;
}

export async function recoverStaleAudits(): Promise<number> {
  return storeAdapter.recoverStaleAudits(STALE_AUDIT_MS);
}

export async function getOperationalHealth() {
  const data = await storeAdapter.readStore();
  const now = Date.now();
  const queued = data.audits.filter((audit) => audit.status === "queued");
  const running = data.audits.filter((audit) => audit.status === "running");
  const failed = data.audits.filter((audit) => audit.status === "failed");
  const stale = [...queued, ...running].filter((audit) => {
    const activeAt = Date.parse(
      audit.startedAt ?? audit.updatedAt ?? audit.createdAt,
    );
    return now - activeAt > STALE_AUDIT_MS;
  });
  const failedByReason = failed.reduce<Record<string, number>>((acc, audit) => {
    const reason = audit.failureReason ?? "Unknown";
    acc[reason] = (acc[reason] ?? 0) + 1;
    return acc;
  }, {});
  const scheduledOverdue = data.websites.filter(
    (website) =>
      website.scheduleEnabled &&
      website.nextScheduledRunAt &&
      Date.parse(website.nextScheduledRunAt) < now,
  );
  return {
    totals: {
      users: data.users.length,
      websites: data.websites.length,
      audits: data.audits.length,
      queued: queued.length,
      running: running.length,
      completed: data.audits.filter((audit) => audit.status === "completed")
        .length,
      failed: failed.length,
      stale: stale.length,
      scheduledOverdue: scheduledOverdue.length,
    },
    oldestQueuedAgeMs: queued[0]
      ? now -
        Date.parse(
          queued.sort(
            (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
          )[0].createdAt,
        )
      : 0,
    failedByReason,
    recentFailures: failed
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 10)
      .map((audit) => ({
        id: audit.id,
        requestedUrl: audit.requestedUrl,
        reason: audit.failureReason,
        updatedAt: audit.updatedAt,
      })),
  };
}

export async function updateSchedule(
  userId: string,
  websiteId: string,
  frequency: ScheduleFrequency,
  alertThreshold: number,
) {
  const website = await storeAdapter.getWebsiteById(websiteId, userId);
  if (!website) throw new Error("Website not found.");
  return storeAdapter.updateWebsite(websiteId, {
    scheduleFrequency: frequency,
    scheduleEnabled: frequency !== "manual",
    nextScheduledRunAt: nextRunAt(frequency),
    lastScheduledRunAt:
      frequency === "manual" ? undefined : website.lastScheduledRunAt,
    alertThreshold: Math.max(1, Math.min(50, alertThreshold)),
    updatedAt: nowIso(),
  });
}

export async function updateWebsiteDetails(
  userId: string,
  websiteId: string,
  displayName: string,
) {
  const website = await storeAdapter.getWebsiteById(websiteId, userId);
  if (!website) throw new Error("Website not found.");
  const cleanName = displayName.trim();
  if (cleanName.length < 2 || cleanName.length > 120)
    throw new Error("Website name must be 2 to 120 characters.");
  return storeAdapter.updateWebsite(websiteId, {
    displayName: cleanName,
    updatedAt: nowIso(),
  });
}

export async function deleteWebsiteForUser(userId: string, websiteId: string) {
  return storeAdapter.deleteWebsite(websiteId, userId);
}

export async function deleteAccountForUser(userId: string) {
  return storeAdapter.deleteUser(userId);
}

export async function createOrToggleShare(
  userId: string,
  auditId: string,
  enabled: boolean,
): Promise<ShareLink> {
  const audit = await storeAdapter.getAuditById(auditId, userId);
  if (!audit || audit.status !== "completed")
    throw new Error("Completed audit not found.");
  return storeAdapter.createOrUpdateShareLink(
    auditId,
    enabled,
    () => ({
        id: id(),
        auditRunId: auditId,
        token: id().replaceAll("-", ""),
        enabled,
        createdAt: nowIso(),
      }),
    enabled ? undefined : nowIso(),
  );
}

export async function dueScheduledWebsites(): Promise<Website[]> {
  return storeAdapter.listDueScheduledWebsites();
}
