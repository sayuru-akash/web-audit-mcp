import { and, desc, eq, gt, inArray, or, sql } from "drizzle-orm";
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

function notImplemented(method: string): never {
  throw new Error(
    `Postgres store adapter method not implemented yet: ${method}.`,
  );
}

export const postgresStoreAdapter: StoreAdapter = {
  provider: "postgres",
  async readStore() {
    notImplemented("readStore");
  },
  async updateStore() {
    notImplemented("updateStore");
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
          sql`${passwordResetTokens.usedAt} IS NULL`,
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
          sql`${passwordResetTokens.usedAt} IS NULL`,
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
            sql`${shareLinks.revokedAt} IS NULL`,
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
          sql`${shareLinks.revokedAt} IS NULL`,
          or(
            sql`${shareLinks.expiresAt} IS NULL`,
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

    await db.delete(rateLimits).where(sql`${rateLimits.resetAt} <= ${now}`);

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
      db.delete(sessions).where(sql`${sessions.expiresAt} <= ${now}`),
      db
        .delete(passwordResetTokens)
        .where(
          sql`${passwordResetTokens.usedAt} IS NULL AND ${passwordResetTokens.expiresAt} <= ${now}`,
        ),
      db.delete(rateLimits).where(sql`${rateLimits.resetAt} <= ${now}`),
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
