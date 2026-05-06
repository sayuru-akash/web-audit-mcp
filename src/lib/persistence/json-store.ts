import {
  activeShareFor,
  checkRateLimit,
  findUserBySession,
  findingsFor,
  getStoreHealth,
  getUserDashboard,
  metricsFor,
  readStore,
  pruneExpiredSecurityRecords,
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
  async getSharedAuditReport(token) {
    const data = await readStore();
    const tokenMatch = data.shareLinks.find((item) => item.token === token);
    const share = tokenMatch
      ? activeShareFor(tokenMatch.auditRunId, data.shareLinks)
      : undefined;
    if (!share) return { findings: [], metrics: [] };
    const audit = data.audits.find(
      (item) => item.id === share.auditRunId && item.status === "completed",
    );
    if (!audit) return { findings: [], metrics: [], share };
    const website = data.websites.find((item) => item.id === audit.websiteId);
    return {
      website,
      audit,
      findings: findingsFor(audit.id, data.findings),
      metrics: metricsFor(audit.id, data.metrics),
      share,
    };
  },
  checkRateLimit,
  pruneExpiredSecurityRecords,
  async getStoreHealth() {
    return {
      ...(await getStoreHealth()),
      provider: "json",
    };
  },
};
