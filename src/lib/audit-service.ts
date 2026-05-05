import { addNotification, checkRateLimit, id, nowIso, readStore, updateStore } from "@/lib/store";
import type { AuditRun, ScheduleFrequency, ShareLink, Website } from "@/lib/types";
import { runPageAudit } from "@/lib/audit-engine";
import { normalizeWebsiteUrl } from "@/lib/url";

export async function addWebsiteForUser(userId: string, url: string, displayName?: string): Promise<Website> {
  const normalized = normalizeWebsiteUrl(url);
  const allowed = await checkRateLimit(`add-website:${userId}`, 20, 60 * 60 * 1000);
  if (!allowed) throw new Error("Too many website changes. Please try again later.");
  return updateStore((data) => {
    const duplicate = data.websites.find(
      (site) => site.userId === userId && site.normalizedUrl === normalized.normalizedUrl,
    );
    if (duplicate) return duplicate;
    if (data.websites.filter((site) => site.userId === userId).length >= 50) {
      throw new Error("Website limit reached for this account.");
    }
    const ts = nowIso();
    const website: Website = {
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
    };
    data.websites.push(website);
    return website;
  });
}

export async function runAuditForWebsite(userId: string, websiteId: string): Promise<AuditRun> {
  const canRun = await checkRateLimit(`audit-user:${userId}`, 12, 60 * 60 * 1000);
  if (!canRun) throw new Error("Audit limit reached. Please try again later.");
  const audit = await updateStore((data) => {
    const website = data.websites.find((site) => site.id === websiteId && site.userId === userId);
    if (!website) throw new Error("Website not found.");
    const duplicate = data.audits.find(
      (item) => item.websiteId === websiteId && (item.status === "queued" || item.status === "running"),
    );
    if (duplicate) return duplicate;
    const ts = nowIso();
    const auditRun: AuditRun = {
      id: id(),
      websiteId,
      userId,
      status: "queued",
      requestedUrl: website.normalizedUrl,
      profile: "desktop",
      createdAt: ts,
      updatedAt: ts,
    };
    data.audits.push(auditRun);
    return auditRun;
  });
  if (audit.status !== "queued") return audit;
  return processAudit(audit.id);
}

export async function processAudit(auditId: string): Promise<AuditRun> {
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
      const website = data.websites.find((site) => site.id === current.websiteId);
      const completedAt = nowIso();
      const previousCompleted = data.audits
        .filter(
          (item) =>
            item.websiteId === current.websiteId &&
            item.id !== current.id &&
            item.status === "completed" &&
            item.overallScore !== undefined,
        )
        .sort((a, b) => Date.parse(b.completedAt ?? b.createdAt) - Date.parse(a.completedAt ?? a.createdAt))[0];
      current.status = "completed";
      current.finalUrl = result.finalUrl;
      current.completedAt = completedAt;
      current.durationMs = Date.parse(completedAt) - Date.parse(startedAt);
      current.overallScore = result.overallScore;
      current.categoryScores = result.categoryScores;
      current.updatedAt = completedAt;
      data.findings = data.findings.filter((finding) => finding.auditRunId !== auditId);
      data.metrics = data.metrics.filter((metric) => metric.auditRunId !== auditId);
      data.findings.push(...result.findings.map((finding) => ({ ...finding, id: id(), auditRunId: auditId })));
      data.metrics.push(...result.metrics.map((metric) => ({ ...metric, id: id(), auditRunId: auditId })));
      if (website) {
        website.lastAuditId = auditId;
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
      if (data.findings.some((finding) => finding.auditRunId === auditId && finding.severity === "critical")) {
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
        previousCompleted.overallScore - result.overallScore >= (website?.alertThreshold ?? 10)
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
      current.failureReason = error instanceof Error ? error.message : "The audit failed unexpectedly.";
      current.completedAt = nowIso();
      current.updatedAt = current.completedAt;
      addNotification(data, {
        userId: current.userId,
        websiteId: current.websiteId,
        auditRunId: current.id,
        type: "audit_failed",
        title: "Audit failed",
        message: "We could not complete this audit. Please retry after checking the URL.",
      });
      return current;
    });
  }
}

export async function updateSchedule(
  userId: string,
  websiteId: string,
  frequency: ScheduleFrequency,
  alertThreshold: number,
) {
  return updateStore((data) => {
    const website = data.websites.find((site) => site.id === websiteId && site.userId === userId);
    if (!website) throw new Error("Website not found.");
    website.scheduleFrequency = frequency;
    website.scheduleEnabled = frequency !== "manual";
    website.alertThreshold = Math.max(1, Math.min(50, alertThreshold));
    website.updatedAt = nowIso();
    return website;
  });
}

export async function createOrToggleShare(userId: string, auditId: string, enabled: boolean): Promise<ShareLink> {
  return updateStore((data) => {
    const audit = data.audits.find((item) => item.id === auditId && item.userId === userId && item.status === "completed");
    if (!audit) throw new Error("Completed audit not found.");
    let link = data.shareLinks.find((item) => item.auditRunId === auditId && !item.revokedAt);
    if (!link) {
      link = { id: id(), auditRunId: auditId, token: id().replaceAll("-", ""), enabled, createdAt: nowIso() };
      data.shareLinks.push(link);
    }
    link.enabled = enabled;
    if (!enabled) link.revokedAt = nowIso();
    return link;
  });
}

export async function dueScheduledWebsites(): Promise<Website[]> {
  const data = await readStore();
  const now = Date.now();
  return data.websites.filter((website) => {
    if (!website.scheduleEnabled || website.scheduleFrequency === "manual") return false;
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
    return now - Date.parse(latest.createdAt) >= interval;
  });
}
