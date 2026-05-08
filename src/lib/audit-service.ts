import {
  addNotification,
  id,
  nowIso,
  readStore,
  updateStore,
} from "@/lib/store";
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
  await updateStore((data) => {
    const audit = data.audits.find((item) => item.id === auditId);
    if (!audit) throw new Error("Audit not found.");
    audit.status = "running";
    audit.startedAt = startedAt;
    audit.updatedAt = startedAt;
  });

  const snapshot = await readStore();
  const audit = snapshot.audits.find((item) => item.id === auditId);
  if (!audit) throw new Error("Audit not found.");
  try {
    const result = await runPageAudit(audit.requestedUrl);
    return updateStore((data) => {
      const current = data.audits.find((item) => item.id === auditId);
      if (!current) throw new Error("Audit not found.");
      const website = data.websites.find(
        (site: Website) => site.id === current.websiteId,
      );
      const completedAt = nowIso();
      const previousCompleted = data.audits
        .filter(
          (item) =>
            item.websiteId === current.websiteId &&
            item.id !== current.id &&
            item.status === "completed" &&
            item.overallScore !== undefined,
        )
        .sort(
          (a, b) =>
            Date.parse(b.completedAt ?? b.createdAt) -
            Date.parse(a.completedAt ?? a.createdAt),
        )[0];
      current.status = "completed";
      current.finalUrl = result.finalUrl;
      current.completedAt = completedAt;
      current.durationMs = Date.parse(completedAt) - Date.parse(startedAt);
      current.overallScore = result.overallScore;
      current.categoryScores = result.categoryScores;
      current.updatedAt = completedAt;
      data.findings = data.findings.filter(
        (finding) => finding.auditRunId !== auditId,
      );
      data.metrics = data.metrics.filter(
        (metric) => metric.auditRunId !== auditId,
      );
      data.findings.push(
        ...result.findings.map((finding) => ({
          ...finding,
          id: id(),
          auditRunId: auditId,
        })),
      );
      data.metrics.push(
        ...result.metrics.map((metric) => ({
          ...metric,
          id: id(),
          auditRunId: auditId,
        })),
      );
      if (website) {
        website.lastAuditId = auditId;
        if (source === "scheduled") {
          website.lastScheduledRunAt = completedAt;
          website.nextScheduledRunAt = nextRunAt(
            website.scheduleFrequency,
            new Date(completedAt),
          );
        }
        website.updatedAt = completedAt;
      }
      addNotification(data, {
        userId: current.userId,
        websiteId: current.websiteId,
        auditRunId: current.id,
        type: "audit_completed",
        title: "Audit completed",
        message: `${website?.displayName ?? "Website"} scored ${result.overallScore}.`,
      });
      if (source === "scheduled") {
        addNotification(data, {
          userId: current.userId,
          websiteId: current.websiteId,
          auditRunId: current.id,
          type: "scheduled_completed",
          title: "Scheduled audit completed",
          message: `${website?.displayName ?? "Website"} finished its scheduled audit.`,
        });
      }
      if (
        data.findings.some(
          (finding) =>
            finding.auditRunId === auditId &&
            finding.status === "failed" &&
            finding.severity === "critical",
        )
      ) {
        addNotification(data, {
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
        addNotification(data, {
          userId: current.userId,
          websiteId: current.websiteId,
          auditRunId: current.id,
          type: "score_dropped",
          title: "Score dropped",
          message: `Overall score dropped from ${previousCompleted.overallScore} to ${result.overallScore}.`,
        });
      }
      return current;
    });
  } catch (error) {
    return updateStore((data) => {
      const current = data.audits.find((item) => item.id === auditId);
      if (!current) throw new Error("Audit not found.");
      current.status = "failed";
      current.failureReason =
        error instanceof Error
          ? error.message
          : "The audit failed unexpectedly.";
      current.completedAt = nowIso();
      current.updatedAt = current.completedAt;
      const website = data.websites.find(
        (site) => site.id === current.websiteId,
      );
      if (source === "scheduled" && website) {
        website.lastScheduledRunAt = current.completedAt;
        website.nextScheduledRunAt = nextRunAt(
          website.scheduleFrequency,
          new Date(current.completedAt),
        );
      }
      addNotification(data, {
        userId: current.userId,
        websiteId: current.websiteId,
        auditRunId: current.id,
        type: "audit_failed",
        title: "Audit failed",
        message:
          "We could not complete this audit. Please retry after checking the URL.",
      });
      return current;
    });
  }
}

export async function processQueuedAudits(limit = 3): Promise<AuditRun[]> {
  await recoverStaleAudits();
  const data = await readStore();
  const queued = data.audits
    .filter((audit) => audit.status === "queued")
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .slice(0, Math.max(1, Math.min(10, limit)));
  const processed: AuditRun[] = [];
  for (const audit of queued) {
    processed.push(await processAudit(audit.id));
  }
  return processed;
}

export async function recoverStaleAudits(): Promise<number> {
  return updateStore((data) => {
    const cutoff = Date.now() - STALE_AUDIT_MS;
    let recovered = 0;
    for (const audit of data.audits) {
      const activeAt = Date.parse(
        audit.startedAt ?? audit.updatedAt ?? audit.createdAt,
      );
      if (
        (audit.status === "running" || audit.status === "queued") &&
        activeAt < cutoff
      ) {
        audit.status = "failed";
        audit.failureReason =
          "Audit was marked stale after the worker did not finish in time.";
        audit.completedAt = nowIso();
        audit.updatedAt = audit.completedAt;
        recovered += 1;
      }
    }
    return recovered;
  });
}

export async function getOperationalHealth() {
  const data = await readStore();
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
  return updateStore((data) => {
    const website = data.websites.find(
      (site) => site.id === websiteId && site.userId === userId,
    );
    if (!website) throw new Error("Website not found.");
    website.scheduleFrequency = frequency;
    website.scheduleEnabled = frequency !== "manual";
    website.nextScheduledRunAt = nextRunAt(frequency);
    if (frequency === "manual") {
      website.lastScheduledRunAt = undefined;
    }
    website.alertThreshold = Math.max(1, Math.min(50, alertThreshold));
    website.updatedAt = nowIso();
    return website;
  });
}

export async function updateWebsiteDetails(
  userId: string,
  websiteId: string,
  displayName: string,
) {
  return updateStore((data) => {
    const website = data.websites.find(
      (site) => site.id === websiteId && site.userId === userId,
    );
    if (!website) throw new Error("Website not found.");
    const cleanName = displayName.trim();
    if (cleanName.length < 2 || cleanName.length > 120)
      throw new Error("Website name must be 2 to 120 characters.");
    website.displayName = cleanName;
    website.updatedAt = nowIso();
    return website;
  });
}

export async function deleteWebsiteForUser(userId: string, websiteId: string) {
  return updateStore((data) => {
    const website = data.websites.find(
      (site) => site.id === websiteId && site.userId === userId,
    );
    if (!website) throw new Error("Website not found.");
    const auditIds = new Set(
      data.audits
        .filter((audit) => audit.websiteId === websiteId)
        .map((audit) => audit.id),
    );
    data.shareLinks = data.shareLinks.filter(
      (link) => !auditIds.has(link.auditRunId),
    );
    data.metrics = data.metrics.filter(
      (metric) => !auditIds.has(metric.auditRunId),
    );
    data.findings = data.findings.filter(
      (finding) => !auditIds.has(finding.auditRunId),
    );
    data.notifications = data.notifications.filter(
      (notification) => notification.websiteId !== websiteId,
    );
    data.audits = data.audits.filter((audit) => audit.websiteId !== websiteId);
    data.websites = data.websites.filter((site) => site.id !== websiteId);
  });
}

export async function deleteAccountForUser(userId: string) {
  return updateStore((data) => {
    const websiteIds = new Set(
      data.websites
        .filter((website) => website.userId === userId)
        .map((website) => website.id),
    );
    const auditIds = new Set(
      data.audits
        .filter((audit) => audit.userId === userId)
        .map((audit) => audit.id),
    );
    data.shareLinks = data.shareLinks.filter(
      (link) => !auditIds.has(link.auditRunId),
    );
    data.metrics = data.metrics.filter(
      (metric) => !auditIds.has(metric.auditRunId),
    );
    data.findings = data.findings.filter(
      (finding) => !auditIds.has(finding.auditRunId),
    );
    data.notifications = data.notifications.filter(
      (notification) => notification.userId !== userId,
    );
    data.audits = data.audits.filter((audit) => audit.userId !== userId);
    data.websites = data.websites.filter(
      (website) => !websiteIds.has(website.id),
    );
    data.sessions = data.sessions.filter(
      (session) => session.userId !== userId,
    );
    data.users = data.users.filter((user) => user.id !== userId);
  });
}

export async function createOrToggleShare(
  userId: string,
  auditId: string,
  enabled: boolean,
): Promise<ShareLink> {
  return updateStore((data) => {
    const audit = data.audits.find(
      (item) =>
        item.id === auditId &&
        item.userId === userId &&
        item.status === "completed",
    );
    if (!audit) throw new Error("Completed audit not found.");
    let link = data.shareLinks.find(
      (item) => item.auditRunId === auditId && !item.revokedAt,
    );
    if (!link) {
      link = {
        id: id(),
        auditRunId: auditId,
        token: id().replaceAll("-", ""),
        enabled,
        createdAt: nowIso(),
      };
      data.shareLinks.push(link);
    }
    link.enabled = enabled;
    if (!enabled) link.revokedAt = nowIso();
    return link;
  });
}

export async function dueScheduledWebsites(): Promise<Website[]> {
  const data = await readStore();
  const currentTime = Date.now();
  return data.websites.filter((website) => {
    if (!website.scheduleEnabled || website.scheduleFrequency === "manual")
      return false;
    if (website.nextScheduledRunAt)
      return Date.parse(website.nextScheduledRunAt) <= currentTime;
    const latest = data.audits
      .filter((audit) => audit.websiteId === website.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    if (!latest) return true;
    const interval = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
      manual: Infinity,
    }[website.scheduleFrequency];
    return currentTime - Date.parse(latest.createdAt) >= interval;
  });
}
