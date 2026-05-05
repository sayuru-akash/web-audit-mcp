export type AuditStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type AuditCategory = "performance" | "seo" | "accessibility" | "security" | "technical" | "mobile";
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type FindingStatus = "passed" | "failed" | "skipped";
export type ScheduleFrequency = "manual" | "daily" | "weekly" | "monthly";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

export type Website = {
  id: string;
  userId: string;
  displayName: string;
  originalUrl: string;
  normalizedUrl: string;
  domain: string;
  faviconUrl?: string;
  scheduleFrequency: ScheduleFrequency;
  scheduleEnabled: boolean;
  alertThreshold: number;
  lastAuditId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryScores = Record<AuditCategory, number>;

export type AuditRun = {
  id: string;
  websiteId: string;
  userId: string;
  status: AuditStatus;
  requestedUrl: string;
  finalUrl?: string;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
  overallScore?: number;
  categoryScores?: CategoryScores;
  durationMs?: number;
  profile: "desktop" | "mobile";
  createdAt: string;
  updatedAt: string;
};

export type Finding = {
  id: string;
  auditRunId: string;
  category: AuditCategory;
  severity: Severity;
  status: FindingStatus;
  title: string;
  description: string;
  evidence: string;
  impact: string;
  recommendation: string;
  technicalDetails?: string;
  sortPriority: number;
};

export type Metric = {
  id: string;
  auditRunId: string;
  category: AuditCategory;
  key: string;
  label: string;
  value: string | number;
  unit?: string;
};

export type Notification = {
  id: string;
  userId: string;
  websiteId?: string;
  auditRunId?: string;
  type: "audit_completed" | "audit_failed" | "critical_issue" | "score_dropped" | "scheduled_completed";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type ShareLink = {
  id: string;
  auditRunId: string;
  token: string;
  enabled: boolean;
  expiresAt?: string;
  revokedAt?: string;
  createdAt: string;
};

export type StoreData = {
  users: User[];
  sessions: Session[];
  websites: Website[];
  audits: AuditRun[];
  findings: Finding[];
  metrics: Metric[];
  notifications: Notification[];
  shareLinks: ShareLink[];
  rateLimits: { key: string; count: number; resetAt: string }[];
};
