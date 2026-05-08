import {
  activeShareFor,
  checkRateLimit,
  findUserBySession,
  findingsFor,
  getStoreHealth,
  getUserDashboard,
  metricsFor,
  pruneExpiredSecurityRecords,
  readStore,
  updateStore,
} from "@/lib/store";
import type { StoreAdapter } from "@/lib/persistence/types";

export const jsonStoreAdapter: StoreAdapter = {
  provider: "json",
  readStore,
  updateStore,
  async getUserByEmail(email) {
    const data = await readStore();
    return data.users.find((item) => item.email === email);
  },
  async createUser(input) {
    return updateStore((data) => {
      const created = {
        ...input,
        createdAt: input.createdAt ?? new Date().toISOString(),
        updatedAt:
          input.updatedAt ?? input.createdAt ?? new Date().toISOString(),
      };
      data.users.push(created);
      return created;
    });
  },
  async updateUser(userId, updates) {
    return updateStore((data) => {
      const user = data.users.find((item) => item.id === userId);
      if (!user) throw new Error("Account not found.");
      Object.assign(user, updates);
      return user;
    });
  },
  async deleteUser(userId) {
    await updateStore((data) => {
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
  },
  findUserBySession,
  async createSession(input) {
    return updateStore((data) => {
      data.sessions.push(input);
      return input;
    });
  },
  async deleteSessionByTokenHash(tokenHash) {
    await updateStore((data) => {
      data.sessions = data.sessions.filter(
        (session) => session.tokenHash !== tokenHash,
      );
    });
  },
  async deleteSessionsForUser(userId) {
    await updateStore((data) => {
      data.sessions = data.sessions.filter(
        (session) => session.userId !== userId,
      );
    });
  },
  async createPasswordResetToken(input) {
    return updateStore((data) => {
      data.passwordResetTokens = data.passwordResetTokens.filter(
        (item) => item.userId !== input.userId && !item.usedAt,
      );
      data.passwordResetTokens.push(input);
      return input;
    });
  },
  async getValidPasswordResetToken(tokenHash) {
    const data = await readStore();
    return data.passwordResetTokens.find(
      (item) =>
        item.tokenHash === tokenHash &&
        !item.usedAt &&
        Date.parse(item.expiresAt) > Date.now(),
    );
  },
  async markPasswordResetTokenUsed(tokenId, usedAt) {
    await updateStore((data) => {
      const token = data.passwordResetTokens.find(
        (item) => item.id === tokenId,
      );
      if (token) token.usedAt = usedAt;
    });
  },
  getUserDashboard,
  async getAuditReport(auditId, userId) {
    const data = await readStore();
    const audit = data.audits.find(
      (item) => item.id === auditId && (!userId || item.userId === userId),
    );
    if (!audit) return { findings: [], metrics: [] };
    const website = data.websites.find(
      (item) =>
        item.id === audit.websiteId && (!userId || item.userId === userId),
    );
    return {
      website,
      audit,
      findings: findingsFor(audit.id, data.findings),
      metrics: metricsFor(audit.id, data.metrics),
      share: activeShareFor(audit.id, data.shareLinks),
    };
  },
  async getWebsiteById(websiteId, userId) {
    const data = await readStore();
    return data.websites.find(
      (item) => item.id === websiteId && (!userId || item.userId === userId),
    );
  },
  async getWebsitesByUser(userId) {
    const data = await readStore();
    return data.websites.filter((item) => item.userId === userId);
  },
  async createWebsite(website) {
    return updateStore((data) => {
      data.websites.push(website);
      return website;
    });
  },
  async updateWebsite(websiteId, updates) {
    return updateStore((data) => {
      const website = data.websites.find((item) => item.id === websiteId);
      if (!website) throw new Error("Website not found.");
      Object.assign(website, updates);
      return website;
    });
  },
  async deleteWebsite(websiteId, userId) {
    await updateStore((data) => {
      const website = data.websites.find(
        (item) => item.id === websiteId && (!userId || item.userId === userId),
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
      data.audits = data.audits.filter(
        (audit) => audit.websiteId !== websiteId,
      );
      data.websites = data.websites.filter((site) => site.id !== websiteId);
    });
  },
  async getAuditById(auditId, userId) {
    const data = await readStore();
    return data.audits.find(
      (item) => item.id === auditId && (!userId || item.userId === userId),
    );
  },
  async getAuditsByWebsite(websiteId) {
    const data = await readStore();
    return data.audits.filter((item) => item.websiteId === websiteId);
  },
  async findActiveAuditForWebsite(websiteId) {
    const data = await readStore();
    return data.audits.find(
      (item) =>
        item.websiteId === websiteId &&
        (item.status === "queued" || item.status === "running"),
    );
  },
  async getLatestCompletedAuditForWebsite(websiteId, excludeAuditId) {
    const data = await readStore();
    return data.audits
      .filter(
        (item) =>
          item.websiteId === websiteId &&
          item.id !== excludeAuditId &&
          item.status === "completed" &&
          item.overallScore !== undefined,
      )
      .sort(
        (a, b) =>
          Date.parse(b.completedAt ?? b.createdAt) -
          Date.parse(a.completedAt ?? a.createdAt),
      )[0];
  },
  async createAuditRun(audit) {
    return updateStore((data) => {
      data.audits.push(audit);
      return audit;
    });
  },
  async updateAuditRun(auditId, updates) {
    return updateStore((data) => {
      const audit = data.audits.find((item) => item.id === auditId);
      if (!audit) throw new Error("Audit not found.");
      Object.assign(audit, updates);
      return audit;
    });
  },
  async replaceAuditResults(auditId, nextFindings, nextMetrics) {
    await updateStore((data) => {
      data.findings = data.findings.filter(
        (finding) => finding.auditRunId !== auditId,
      );
      data.metrics = data.metrics.filter(
        (metric) => metric.auditRunId !== auditId,
      );
      data.findings.push(...nextFindings);
      data.metrics.push(...nextMetrics);
    });
  },
  async createNotification(notification) {
    return updateStore((data) => {
      data.notifications.push(notification);
      return notification;
    });
  },
  async markNotificationsRead(userId) {
    await updateStore((data) => {
      for (const notification of data.notifications) {
        if (notification.userId === userId) notification.read = true;
      }
    });
  },
  async listQueuedAudits(limit) {
    const data = await readStore();
    return data.audits
      .filter((audit) => audit.status === "queued")
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .slice(0, Math.max(1, Math.min(10, limit)));
  },
  async recoverStaleAudits(cutoffMs) {
    return updateStore((data) => {
      const cutoff = Date.now() - cutoffMs;
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
          audit.completedAt = new Date().toISOString();
          audit.updatedAt = audit.completedAt;
          recovered += 1;
        }
      }
      return recovered;
    });
  },
  async listDueScheduledWebsites(currentTime = Date.now()) {
    const data = await readStore();
    return data.websites.filter((website) => {
      if (!website.scheduleEnabled || website.scheduleFrequency === "manual") {
        return false;
      }
      if (website.nextScheduledRunAt) {
        return Date.parse(website.nextScheduledRunAt) <= currentTime;
      }
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
  },
  async getActiveShareLink(auditId) {
    const data = await readStore();
    return activeShareFor(auditId, data.shareLinks);
  },
  async createOrUpdateShareLink(auditId, enabled, create, revokedAt) {
    return updateStore((data) => {
      let link = data.shareLinks.find(
        (item) => item.auditRunId === auditId && !item.revokedAt,
      );
      if (!link) {
        link = create();
        data.shareLinks.push(link);
      }
      link.enabled = enabled;
      link.revokedAt = revokedAt;
      return link;
    });
  },
  async getSharedAuditReport(token) {
    const data = await readStore();
    const share = data.shareLinks.find(
      (item) => item.token === token && item.enabled && !item.revokedAt,
    );
    if (!share) return { findings: [], metrics: [] };
    const audit = data.audits.find((item) => item.id === share.auditRunId);
    if (!audit) return { findings: [], metrics: [] };
    const website = data.websites.find((item) => item.id === audit.websiteId);
    return {
      share,
      website,
      audit,
      findings: findingsFor(audit.id, data.findings),
      metrics: metricsFor(audit.id, data.metrics),
    };
  },
  checkRateLimit,
  pruneExpiredSecurityRecords,
  getStoreHealth,
};
