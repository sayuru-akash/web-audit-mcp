import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditRun, Finding, Metric, Notification, ShareLink, StoreData, User, Website } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "webaudit.json");
let storeQueue: Promise<unknown> = Promise.resolve();

const emptyStore = (): StoreData => ({
  users: [],
  sessions: [],
  websites: [],
  audits: [],
  findings: [],
  metrics: [],
  notifications: [],
  shareLinks: [],
  passwordResetTokens: [],
  rateLimits: [],
});

export const nowIso = () => new Date().toISOString();
export const id = () => randomUUID();

export async function readStore(): Promise<StoreData> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return { ...emptyStore(), ...JSON.parse(raw) } as StoreData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyStore();
    throw error;
  }
}

export async function writeStore(data: StoreData): Promise<void> {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmp, DATA_FILE);
}

export async function updateStore<T>(mutator: (data: StoreData) => T | Promise<T>): Promise<T> {
  const operation = storeQueue.then(async () => {
    const data = await readStore();
    const result = await mutator(data);
    await writeStore(data);
    return result;
  });
  storeQueue = operation.catch(() => undefined);
  return operation;
}

export function publicUser(user: User) {
  const { passwordHash, ...safeUser } = user;
  void passwordHash;
  return safeUser;
}

export async function findUserBySession(tokenHash: string): Promise<User | undefined> {
  const data = await readStore();
  const session = data.sessions.find((item) => item.tokenHash === tokenHash && Date.parse(item.expiresAt) > Date.now());
  return session ? data.users.find((user) => user.id === session.userId) : undefined;
}

export async function getUserDashboard(userId: string) {
  const data = await readStore();
  const websites = data.websites.filter((website) => website.userId === userId);
  const audits = data.audits
    .filter((audit) => audit.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const notifications = data.notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { data, websites, audits, notifications };
}

export function latestAuditFor(website: Website, audits: AuditRun[]) {
  return audits
    .filter((audit) => audit.websiteId === website.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}

export function findingsFor(auditId: string, findings: Finding[]) {
  return findings.filter((finding) => finding.auditRunId === auditId).sort((a, b) => a.sortPriority - b.sortPriority);
}

export function metricsFor(auditId: string, metrics: Metric[]) {
  return metrics.filter((metric) => metric.auditRunId === auditId);
}

export function activeShareFor(auditId: string, links: ShareLink[]) {
  return links.find(
    (link) =>
      link.auditRunId === auditId &&
      link.enabled &&
      !link.revokedAt &&
      (!link.expiresAt || Date.parse(link.expiresAt) > Date.now()),
  );
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  return updateStore((data) => {
    const now = Date.now();
    data.rateLimits = data.rateLimits.filter((entry) => Date.parse(entry.resetAt) > now);
    const current = data.rateLimits.find((entry) => entry.key === key);
    if (!current) {
      data.rateLimits.push({ key, count: 1, resetAt: new Date(now + windowMs).toISOString() });
      return true;
    }
    if (current.count >= limit) return false;
    current.count += 1;
    return true;
  });
}

export function addNotification(
  data: StoreData,
  notification: Omit<Notification, "id" | "createdAt" | "read">,
): Notification {
  const user = data.users.find((item) => item.id === notification.userId);
  const enabled = {
    audit_completed: user?.notifyOnAuditCompleted ?? true,
    scheduled_completed: user?.notifyOnAuditCompleted ?? true,
    audit_failed: user?.notifyOnAuditFailed ?? true,
    critical_issue: user?.notifyOnCriticalIssue ?? true,
    score_dropped: user?.notifyOnScoreDrop ?? true,
  }[notification.type];
  if (!enabled) {
    return { ...notification, id: id(), read: true, createdAt: nowIso() };
  }
  const created: Notification = { ...notification, id: id(), read: false, createdAt: nowIso() };
  data.notifications.push(created);
  return created;
}
