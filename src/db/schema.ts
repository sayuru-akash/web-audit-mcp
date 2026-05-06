import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const auditStatusEnum = pgEnum("audit_status", ["queued", "running", "completed", "failed", "cancelled"]);
export const auditProfileEnum = pgEnum("audit_profile", ["desktop", "mobile"]);
export const scheduleFrequencyEnum = pgEnum("schedule_frequency", ["manual", "daily", "weekly", "monthly"]);
export const severityEnum = pgEnum("severity", ["critical", "high", "medium", "low", "info"]);
export const findingStatusEnum = pgEnum("finding_status", ["passed", "failed", "needs_review", "skipped"]);
export const auditCategoryEnum = pgEnum("audit_category", [
  "performance",
  "seo",
  "accessibility",
  "security",
  "technical",
  "mobile",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "audit_completed",
  "audit_failed",
  "critical_issue",
  "score_dropped",
  "scheduled_completed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    defaultAuditFrequency: scheduleFrequencyEnum("default_audit_frequency").default("manual"),
    notifyOnAuditCompleted: boolean("notify_on_audit_completed").notNull().default(true),
    notifyOnAuditFailed: boolean("notify_on_audit_failed").notNull().default(true),
    notifyOnCriticalIssue: boolean("notify_on_critical_issue").notNull().default(true),
    notifyOnScoreDrop: boolean("notify_on_score_drop").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sessions_token_hash_unique").on(table.tokenHash), index("sessions_user_idx").on(table.userId)],
);

export const websites = pgTable(
  "websites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    originalUrl: text("original_url").notNull(),
    normalizedUrl: text("normalized_url").notNull(),
    domain: text("domain").notNull(),
    faviconUrl: text("favicon_url"),
    scheduleFrequency: scheduleFrequencyEnum("schedule_frequency").notNull().default("manual"),
    scheduleEnabled: boolean("schedule_enabled").notNull().default(false),
    lastScheduledRunAt: timestamp("last_scheduled_run_at", { withTimezone: true }),
    nextScheduledRunAt: timestamp("next_scheduled_run_at", { withTimezone: true }),
    alertThreshold: integer("alert_threshold").notNull().default(10),
    lastAuditId: text("last_audit_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("websites_user_url_unique").on(table.userId, table.normalizedUrl),
    index("websites_user_idx").on(table.userId),
    index("websites_schedule_idx").on(table.scheduleEnabled, table.nextScheduledRunAt),
  ],
);

export const auditRuns = pgTable(
  "audit_runs",
  {
    id: text("id").primaryKey(),
    websiteId: text("website_id")
      .notNull()
      .references(() => websites.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: auditStatusEnum("status").notNull().default("queued"),
    requestedUrl: text("requested_url").notNull(),
    finalUrl: text("final_url"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    overallScore: integer("overall_score"),
    categoryScores: jsonb("category_scores"),
    durationMs: integer("duration_ms"),
    profile: auditProfileEnum("profile").notNull().default("desktop"),
    ...timestamps,
  },
  (table) => [
    index("audit_runs_user_idx").on(table.userId),
    index("audit_runs_website_idx").on(table.websiteId),
    index("audit_runs_status_idx").on(table.status, table.createdAt),
  ],
);

export const findings = pgTable(
  "findings",
  {
    id: text("id").primaryKey(),
    auditRunId: text("audit_run_id")
      .notNull()
      .references(() => auditRuns.id, { onDelete: "cascade" }),
    category: auditCategoryEnum("category").notNull(),
    severity: severityEnum("severity").notNull(),
    status: findingStatusEnum("status").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    evidence: text("evidence").notNull(),
    impact: text("impact").notNull(),
    recommendation: text("recommendation").notNull(),
    technicalDetails: text("technical_details"),
    sortPriority: integer("sort_priority").notNull(),
  },
  (table) => [index("findings_audit_idx").on(table.auditRunId), index("findings_severity_idx").on(table.severity)],
);

export const metrics = pgTable(
  "metrics",
  {
    id: text("id").primaryKey(),
    auditRunId: text("audit_run_id")
      .notNull()
      .references(() => auditRuns.id, { onDelete: "cascade" }),
    category: auditCategoryEnum("category").notNull(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    value: text("value").notNull(),
    unit: text("unit"),
  },
  (table) => [index("metrics_audit_idx").on(table.auditRunId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    websiteId: text("website_id").references(() => websites.id, { onDelete: "set null" }),
    auditRunId: text("audit_run_id").references(() => auditRuns.id, { onDelete: "set null" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notifications_user_idx").on(table.userId, table.createdAt)],
);

export const shareLinks = pgTable(
  "share_links",
  {
    id: text("id").primaryKey(),
    auditRunId: text("audit_run_id")
      .notNull()
      .references(() => auditRuns.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("share_links_token_unique").on(table.token), index("share_links_audit_idx").on(table.auditRunId)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("password_reset_token_hash_unique").on(table.tokenHash), index("password_reset_user_idx").on(table.userId)],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(1),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("rate_limits_reset_idx").on(table.resetAt)],
);
