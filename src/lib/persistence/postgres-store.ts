import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  or,
} from "drizzle-orm";
import { getDatabase } from "@/db/client";
import {
  auditRuns,
  findings,
  metrics,
  notifications,
  passwordResetTokens,
  rateLimits,
  sessions,
  shareLinks,
  users,
  websites,
} from "@/db/schema";
import type { StoreAdapter } from "@/lib/persistence/types";
import type { CategoryScores } from "@/lib/types";

function mapUser(row: typeof users.$inferSelect) {
  return {
    ...row,
    avatarUrl: row.avatarUrl ?? undefined,
    defaultAuditFrequency: row.defaultAuditFrequency ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapSession(row: typeof sessions.$inferSelect) {
  return {
    ...row,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function mapPasswordResetToken(row: typeof passwordResetTokens.$inferSelect) {
  return {
    ...row,
    expiresAt: row.expiresAt.toISOString(),
    usedAt: row.usedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function mapWebsite(row: typeof websites.$inferSelect) {
  return {
    ...row,
    faviconUrl: row.faviconUrl ?? undefined,
    lastScheduledRunAt: row.lastScheduledRunAt?.toISOString(),
    nextScheduledRunAt: row.nextScheduledRunAt?.toISOString(),
    lastAuditId: row.lastAuditId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAuditRun(row: typeof auditRuns.$inferSelect) {
  return {
    ...row,
    finalUrl: row.finalUrl ?? undefined,
    startedAt: row.startedAt?.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    failureReason: row.failureReason ?? undefined,
    overallScore: row.overallScore ?? undefined,
    categoryScores: (row.categoryScores as CategoryScores | null) ?? undefined,
    durationMs: row.durationMs ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapFinding(row: typeof findings.$inferSelect) {
  return {
    ...row,
    technicalDetails: row.technicalDetails ?? undefined,
  };
}

function mapMetric(row: typeof metrics.$inferSelect) {
  return {
    ...row,
    unit: row.unit ?? undefined,
  };
}

function mapNotification(row: typeof notifications.$inferSelect) {
  return {
    ...row,
    websiteId: row.websiteId ?? undefined,
    auditRunId: row.auditRunId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapShareLink(row: typeof shareLinks.$inferSelect) {
  return {
    ...row,
    expiresAt: row.expiresAt?.toISOString(),
    revokedAt: row.revokedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export const postgresStoreAdapter: StoreAdapter = {
  provider: "postgres",
  async readStore() {
    const db = getDatabase();
    const [
      userRows,
      sessionRows,
      websiteRows,
      auditRows,
      findingRows,
      metricRows,
      notificationRows,
      shareRows,
      resetRows,
      rateLimitRows,
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(sessions),
      db.select().from(websites),
      db.select().from(auditRuns),
      db.select().from(findings),
      db.select().from(metrics),
      db.select().from(notifications),
      db.select().from(shareLinks),
      db.select().from(passwordResetTokens),
      db.select().from(rateLimits),
    ]);
    return {
      version: 1,
      users: userRows.map(mapUser),
      sessions: sessionRows.map(mapSession),
      websites: websiteRows.map(mapWebsite),
      audits: auditRows.map(mapAuditRun),
      findings: findingRows.map(mapFinding),
      metrics: metricRows.map(mapMetric),
      notifications: notificationRows.map(mapNotification),
      shareLinks: shareRows.map(mapShareLink),
      passwordResetTokens: resetRows.map(mapPasswordResetToken),
      rateLimits: rateLimitRows.map((row) => ({
        key: row.key,
        count: row.count,
        resetAt: row.resetAt.toISOString(),
      })),
    };
  },
  async updateStore() {
    throw new Error(
      "Generic updateStore is not supported by the Postgres adapter. Use StoreAdapter methods instead.",
    );
  },
  async getUserByEmail(email) {
    const db = getDatabase();
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row ? mapUser(row) : undefined;
  },
  async createUser(input) {
    const db = getDatabase();
    const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
    const updatedAt = input.updatedAt ? new Date(input.updatedAt) : createdAt;
    const [row] = await db
      .insert(users)
      .values({
        id: input.id,
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        defaultAuditFrequency: input.defaultAuditFrequency ?? "manual",
        notifyOnAuditCompleted: input.notifyOnAuditCompleted ?? true,
        notifyOnAuditFailed: input.notifyOnAuditFailed ?? true,
        notifyOnCriticalIssue: input.notifyOnCriticalIssue ?? true,
        notifyOnScoreDrop: input.notifyOnScoreDrop ?? true,
        createdAt,
        updatedAt,
      })
      .returning();
    return mapUser(row);
  },
  async updateUser(userId, updates) {
    const db = getDatabase();
    const payload: Partial<typeof users.$inferInsert> = {};
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.passwordHash !== undefined)
      payload.passwordHash = updates.passwordHash;
    if (updates.displayName !== undefined)
      payload.displayName = updates.displayName;
    if (updates.avatarUrl !== undefined) payload.avatarUrl = updates.avatarUrl;
    if (updates.defaultAuditFrequency !== undefined)
      payload.defaultAuditFrequency = updates.defaultAuditFrequency;
    if (updates.notifyOnAuditCompleted !== undefined)
      payload.notifyOnAuditCompleted = updates.notifyOnAuditCompleted;
    if (updates.notifyOnAuditFailed !== undefined)
      payload.notifyOnAuditFailed = updates.notifyOnAuditFailed;
    if (updates.notifyOnCriticalIssue !== undefined)
      payload.notifyOnCriticalIssue = updates.notifyOnCriticalIssue;
    if (updates.notifyOnScoreDrop !== undefined)
      payload.notifyOnScoreDrop = updates.notifyOnScoreDrop;
    if (updates.updatedAt !== undefined)
      payload.updatedAt = new Date(updates.updatedAt);

    const [row] = await db
      .update(users)
      .set(payload)
      .where(eq(users.id, userId))
      .returning();
    if (!row) throw new Error("Account not found.");
    return mapUser(row);
  },
  async deleteUser(userId) {
    const db = getDatabase();
    await db.delete(users).where(eq(users.id, userId));
  },
  async findUserBySession(tokenHash) {
    const db = getDatabase();
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        defaultAuditFrequency: users.defaultAuditFrequency,
        notifyOnAuditCompleted: users.notifyOnAuditCompleted,
        notifyOnAuditFailed: users.notifyOnAuditFailed,
        notifyOnCriticalIssue: users.notifyOnCriticalIssue,
        notifyOnScoreDrop: users.notifyOnScoreDrop,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!row) return undefined;

    return mapUser(row);
  },
  async createSession(input) {
    const db = getDatabase();
    const [row] = await db
      .insert(sessions)
      .values({
        ...input,
        expiresAt: new Date(input.expiresAt),
        createdAt: new Date(input.createdAt),
      })
      .returning();
    return mapSession(row);
  },
  async deleteSessionByTokenHash(tokenHash) {
    const db = getDatabase();
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  },
  async deleteSessionsForUser(userId) {
    const db = getDatabase();
    await db.delete(sessions).where(eq(sessions.userId, userId));
  },
  async createPasswordResetToken(input) {
    const db = getDatabase();
    await db
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, input.userId),
          isNull(passwordResetTokens.usedAt),
        ),
      );
    const [row] = await db
      .insert(passwordResetTokens)
      .values({
        ...input,
        expiresAt: new Date(input.expiresAt),
        usedAt: input.usedAt ? new Date(input.usedAt) : null,
        createdAt: new Date(input.createdAt),
      })
      .returning();
    return mapPasswordResetToken(row);
  },
  async getValidPasswordResetToken(tokenHash) {
    const db = getDatabase();
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row ? mapPasswordResetToken(row) : undefined;
  },
  async markPasswordResetTokenUsed(tokenId, usedAt) {
    const db = getDatabase();
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date(usedAt) })
      .where(eq(passwordResetTokens.id, tokenId));
  },
  async getUserDashboard(userId) {
    const db = getDatabase();
    const [websiteRows, auditRows, notificationRows] = await Promise.all([
      db.select().from(websites).where(eq(websites.userId, userId)),
      db
        .select()
        .from(auditRuns)
        .where(eq(auditRuns.userId, userId))
        .orderBy(desc(auditRuns.createdAt)),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt)),
    ]);

    return {
      data: {
        version: 1,
        users: [],
        sessions: [],
        websites: websiteRows.map(mapWebsite),
        audits: auditRows.map(mapAuditRun),
        findings: [],
        metrics: [],
        notifications: notificationRows.map(mapNotification),
        shareLinks: [],
        passwordResetTokens: [],
        rateLimits: [],
      },
      websites: websiteRows.map(mapWebsite),
      audits: auditRows.map(mapAuditRun),
      notifications: notificationRows.map(mapNotification),
    };
  },
  async getAuditReport(auditId, userId) {
    const db = getDatabase();
    const auditWhere = userId
      ? and(eq(auditRuns.id, auditId), eq(auditRuns.userId, userId))
      : eq(auditRuns.id, auditId);
    const [auditRow] = await db
      .select()
      .from(auditRuns)
      .where(auditWhere)
      .limit(1);
    if (!auditRow) return { findings: [], metrics: [] };

    const [websiteRow, findingRows, metricRows, shareRow] = await Promise.all([
      db
        .select()
        .from(websites)
        .where(eq(websites.id, auditRow.websiteId))
        .limit(1)
        .then((rows) => rows[0]),
      db.select().from(findings).where(eq(findings.auditRunId, auditId)),
      db.select().from(metrics).where(eq(metrics.auditRunId, auditId)),
      db
        .select()
        .from(shareLinks)
        .where(
          and(
            eq(shareLinks.auditRunId, auditId),
            eq(shareLinks.enabled, true),
            isNull(shareLinks.revokedAt),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]),
    ]);

    return {
      website: websiteRow ? mapWebsite(websiteRow) : undefined,
      audit: mapAuditRun(auditRow),
      findings: findingRows
        .map(mapFinding)
        .sort((a, b) => a.sortPriority - b.sortPriority),
      metrics: metricRows.map(mapMetric),
      share: shareRow ? mapShareLink(shareRow) : undefined,
    };
  },
  async getWebsiteById(websiteId, userId) {
    const db = getDatabase();
    const where = userId
      ? and(eq(websites.id, websiteId), eq(websites.userId, userId))
      : eq(websites.id, websiteId);
    const [row] = await db.select().from(websites).where(where).limit(1);
    return row ? mapWebsite(row) : undefined;
  },
  async getWebsitesByUser(userId) {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(websites)
      .where(eq(websites.userId, userId));
    return rows.map(mapWebsite);
  },
  async createWebsite(website) {
    const db = getDatabase();
    const [row] = await db
      .insert(websites)
      .values({
        ...website,
        lastScheduledRunAt: website.lastScheduledRunAt
          ? new Date(website.lastScheduledRunAt)
          : null,
        nextScheduledRunAt: website.nextScheduledRunAt
          ? new Date(website.nextScheduledRunAt)
          : null,
        createdAt: new Date(website.createdAt),
        updatedAt: new Date(website.updatedAt),
      })
      .returning();
    return mapWebsite(row);
  },
  async updateWebsite(websiteId, updates) {
    const db = getDatabase();
    const payload: Partial<typeof websites.$inferInsert> = {};
    if (updates.displayName !== undefined)
      payload.displayName = updates.displayName;
    if (updates.originalUrl !== undefined)
      payload.originalUrl = updates.originalUrl;
    if (updates.normalizedUrl !== undefined)
      payload.normalizedUrl = updates.normalizedUrl;
    if (updates.domain !== undefined) payload.domain = updates.domain;
    if (updates.faviconUrl !== undefined)
      payload.faviconUrl = updates.faviconUrl;
    if (updates.scheduleFrequency !== undefined)
      payload.scheduleFrequency = updates.scheduleFrequency;
    if (updates.scheduleEnabled !== undefined)
      payload.scheduleEnabled = updates.scheduleEnabled;
    if (updates.lastScheduledRunAt !== undefined)
      payload.lastScheduledRunAt = updates.lastScheduledRunAt
        ? new Date(updates.lastScheduledRunAt)
        : null;
    if (updates.nextScheduledRunAt !== undefined)
      payload.nextScheduledRunAt = updates.nextScheduledRunAt
        ? new Date(updates.nextScheduledRunAt)
        : null;
    if (updates.alertThreshold !== undefined)
      payload.alertThreshold = updates.alertThreshold;
    if (updates.lastAuditId !== undefined)
      payload.lastAuditId = updates.lastAuditId;
    if (updates.updatedAt !== undefined)
      payload.updatedAt = new Date(updates.updatedAt);
    const [row] = await db
      .update(websites)
      .set(payload)
      .where(eq(websites.id, websiteId))
      .returning();
    if (!row) throw new Error("Website not found.");
    return mapWebsite(row);
  },
  async deleteWebsite(websiteId, userId) {
    const db = getDatabase();
    const where = userId
      ? and(eq(websites.id, websiteId), eq(websites.userId, userId))
      : eq(websites.id, websiteId);
    const [website] = await db.select().from(websites).where(where).limit(1);
    if (!website) throw new Error("Website not found.");
    await db
      .delete(notifications)
      .where(eq(notifications.websiteId, websiteId));
    await db.delete(websites).where(eq(websites.id, websiteId));
  },
  async getAuditById(auditId, userId) {
    const db = getDatabase();
    const where = userId
      ? and(eq(auditRuns.id, auditId), eq(auditRuns.userId, userId))
      : eq(auditRuns.id, auditId);
    const [row] = await db.select().from(auditRuns).where(where).limit(1);
    return row ? mapAuditRun(row) : undefined;
  },
  async getAuditsByWebsite(websiteId) {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(auditRuns)
      .where(eq(auditRuns.websiteId, websiteId));
    return rows.map(mapAuditRun);
  },
  async findActiveAuditForWebsite(websiteId) {
    const db = getDatabase();
    const [row] = await db
      .select()
      .from(auditRuns)
      .where(
        and(
          eq(auditRuns.websiteId, websiteId),
          inArray(auditRuns.status, ["queued", "running"]),
        ),
      )
      .limit(1);
    return row ? mapAuditRun(row) : undefined;
  },
  async getLatestCompletedAuditForWebsite(websiteId, excludeAuditId) {
    const db = getDatabase();
    const conditions = [
      eq(auditRuns.websiteId, websiteId),
      eq(auditRuns.status, "completed"),
      isNotNull(auditRuns.overallScore),
    ];
    if (excludeAuditId) {
      conditions.push(ne(auditRuns.id, excludeAuditId) as never);
    }
    const [row] = await db
      .select()
      .from(auditRuns)
      .where(and(...conditions))
      .orderBy(desc(auditRuns.completedAt), desc(auditRuns.createdAt))
      .limit(1);
    return row ? mapAuditRun(row) : undefined;
  },
  async createAuditRun(audit) {
    const db = getDatabase();
    const [row] = await db
      .insert(auditRuns)
      .values({
        ...audit,
        finalUrl: audit.finalUrl ?? null,
        startedAt: audit.startedAt ? new Date(audit.startedAt) : null,
        completedAt: audit.completedAt ? new Date(audit.completedAt) : null,
        failureReason: audit.failureReason ?? null,
        overallScore: audit.overallScore ?? null,
        categoryScores: audit.categoryScores ?? null,
        durationMs: audit.durationMs ?? null,
        createdAt: new Date(audit.createdAt),
        updatedAt: new Date(audit.updatedAt),
      })
      .returning();
    return mapAuditRun(row);
  },
  async updateAuditRun(auditId, updates) {
    const db = getDatabase();
    const payload: Partial<typeof auditRuns.$inferInsert> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.requestedUrl !== undefined)
      payload.requestedUrl = updates.requestedUrl;
    if (updates.finalUrl !== undefined)
      payload.finalUrl = updates.finalUrl ?? null;
    if (updates.startedAt !== undefined)
      payload.startedAt = updates.startedAt
        ? new Date(updates.startedAt)
        : null;
    if (updates.completedAt !== undefined)
      payload.completedAt = updates.completedAt
        ? new Date(updates.completedAt)
        : null;
    if (updates.failureReason !== undefined)
      payload.failureReason = updates.failureReason ?? null;
    if (updates.overallScore !== undefined)
      payload.overallScore = updates.overallScore ?? null;
    if (updates.categoryScores !== undefined)
      payload.categoryScores = updates.categoryScores ?? null;
    if (updates.durationMs !== undefined)
      payload.durationMs = updates.durationMs ?? null;
    if (updates.profile !== undefined) payload.profile = updates.profile;
    if (updates.updatedAt !== undefined)
      payload.updatedAt = new Date(updates.updatedAt);
    const [row] = await db
      .update(auditRuns)
      .set(payload)
      .where(eq(auditRuns.id, auditId))
      .returning();
    if (!row) throw new Error("Audit not found.");
    return mapAuditRun(row);
  },
  async replaceAuditResults(auditId, nextFindings, nextMetrics) {
    const db = getDatabase();
    await db.delete(findings).where(eq(findings.auditRunId, auditId));
    await db.delete(metrics).where(eq(metrics.auditRunId, auditId));
    if (nextFindings.length > 0) {
      await db.insert(findings).values(
        nextFindings.map((finding) => ({
          ...finding,
          technicalDetails: finding.technicalDetails ?? null,
        })),
      );
    }
    if (nextMetrics.length > 0) {
      await db.insert(metrics).values(
        nextMetrics.map((metric) => ({
          ...metric,
          value: String(metric.value),
          unit: metric.unit ?? null,
        })),
      );
    }
  },
  async createNotification(notification) {
    const db = getDatabase();
    const [row] = await db
      .insert(notifications)
      .values({
        ...notification,
        websiteId: notification.websiteId ?? null,
        auditRunId: notification.auditRunId ?? null,
        createdAt: new Date(notification.createdAt),
      })
      .returning();
    return mapNotification(row);
  },
  async markNotificationsRead(userId) {
    const db = getDatabase();
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  },
  async listQueuedAudits(limit) {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(auditRuns)
      .where(eq(auditRuns.status, "queued"))
      .orderBy(asc(auditRuns.createdAt))
      .limit(Math.max(1, Math.min(10, limit)));
    return rows.map(mapAuditRun);
  },
  async recoverStaleAudits(cutoffMs) {
    const db = getDatabase();
    const cutoff = new Date(Date.now() - cutoffMs);
    const completedAt = new Date();
    const rows = await db
      .update(auditRuns)
      .set({
        status: "failed",
        failureReason:
          "Audit was marked stale after the worker did not finish in time.",
        completedAt,
        updatedAt: completedAt,
      })
      .where(
        and(
          inArray(auditRuns.status, ["queued", "running"]),
          or(
            lt(auditRuns.startedAt, cutoff),
            and(isNull(auditRuns.startedAt), lt(auditRuns.updatedAt, cutoff)),
            and(
              isNull(auditRuns.startedAt),
              isNull(auditRuns.updatedAt),
              lt(auditRuns.createdAt, cutoff),
            ),
          ),
        ),
      )
      .returning({ id: auditRuns.id });
    return rows.length;
  },
  async listDueScheduledWebsites(currentTime = Date.now()) {
    const db = getDatabase();
    const now = new Date(currentTime);
    const rows = await db
      .select()
      .from(websites)
      .where(
        and(
          eq(websites.scheduleEnabled, true),
          ne(websites.scheduleFrequency, "manual"),
          or(
            isNull(websites.nextScheduledRunAt),
            lte(websites.nextScheduledRunAt, now),
          ),
        ),
      );
    return rows.map(mapWebsite);
  },
  async getActiveShareLink(auditId) {
    const db = getDatabase();
    const [row] = await db
      .select()
      .from(shareLinks)
      .where(
        and(
          eq(shareLinks.auditRunId, auditId),
          eq(shareLinks.enabled, true),
          isNull(shareLinks.revokedAt),
        ),
      )
      .limit(1);
    return row ? mapShareLink(row) : undefined;
  },
  async createOrUpdateShareLink(auditId, enabled, create, revokedAt) {
    const db = getDatabase();
    const [existing] = await db
      .select()
      .from(shareLinks)
      .where(
        and(
          eq(shareLinks.auditRunId, auditId),
          isNull(shareLinks.revokedAt),
        ),
      )
      .limit(1);
    if (!existing) {
      const link = create();
      const [row] = await db
        .insert(shareLinks)
        .values({
          ...link,
          expiresAt: link.expiresAt ? new Date(link.expiresAt) : null,
          revokedAt: link.revokedAt ? new Date(link.revokedAt) : null,
          createdAt: new Date(link.createdAt),
        })
        .returning();
      return mapShareLink(row);
    }
    const [row] = await db
      .update(shareLinks)
      .set({
        enabled,
        revokedAt: revokedAt ? new Date(revokedAt) : null,
      })
      .where(eq(shareLinks.id, existing.id))
      .returning();
    return mapShareLink(row);
  },
  async getSharedAuditReport(token) {
    const db = getDatabase();
    const now = new Date();
    const [shareRow] = await db
      .select()
      .from(shareLinks)
      .where(
        and(
          eq(shareLinks.token, token),
          eq(shareLinks.enabled, true),
          isNull(shareLinks.revokedAt),
          or(
            isNull(shareLinks.expiresAt),
            gt(shareLinks.expiresAt, now),
          ),
        ),
      )
      .limit(1);
    if (!shareRow) return { findings: [], metrics: [] };
    return this.getAuditReport(shareRow.auditRunId);
  },
  async checkRateLimit(key, limit, windowMs) {
    const db = getDatabase();
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    await db.delete(rateLimits).where(lte(rateLimits.resetAt, now));

    const [current] = await db
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .limit(1);
    if (!current) {
      await db.insert(rateLimits).values({ key, count: 1, resetAt });
      return true;
    }

    if (current.count >= limit) {
      return false;
    }

    await db
      .update(rateLimits)
      .set({ count: current.count + 1, resetAt: current.resetAt })
      .where(eq(rateLimits.key, key));

    return true;
  },
  async pruneExpiredSecurityRecords() {
    const db = getDatabase();
    const now = new Date();
    await Promise.all([
      db.delete(sessions).where(lte(sessions.expiresAt, now)),
      db
        .delete(passwordResetTokens)
        .where(
          and(
            isNull(passwordResetTokens.usedAt),
            lte(passwordResetTokens.expiresAt, now),
          ),
        ),
      db.delete(rateLimits).where(lte(rateLimits.resetAt, now)),
    ]);
  },
  async getStoreHealth() {
    return {
      ok: true,
      provider: "postgres",
      version: 1,
    };
  },
};
