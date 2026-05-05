import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let dataDir: string;
const originalCwd = process.cwd();

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "web-audit-service-"));
  process.chdir(dataDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(dataDir, { recursive: true, force: true });
});

describe("audit service operations", () => {
  it("recovers stale queued and running audits", async () => {
    const { id, nowIso, updateStore, readStore } = await import("../store");
    const old = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await updateStore((data) => {
      const userId = id();
      const websiteId = id();
      data.users.push({
        id: userId,
        email: "admin@example.com",
        passwordHash: "hash",
        displayName: "Admin",
        notifyOnAuditCompleted: true,
        notifyOnAuditFailed: true,
        notifyOnCriticalIssue: true,
        notifyOnScoreDrop: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      data.websites.push({
        id: websiteId,
        userId,
        displayName: "Example",
        originalUrl: "https://example.com",
        normalizedUrl: "https://example.com/",
        domain: "example.com",
        scheduleFrequency: "manual",
        scheduleEnabled: false,
        alertThreshold: 10,
        createdAt: old,
        updatedAt: old,
      });
      for (const status of ["queued", "running"] as const) {
        data.audits.push({
          id: id(),
          websiteId,
          userId,
          status,
          requestedUrl: "https://example.com/",
          profile: "desktop",
          startedAt: old,
          createdAt: old,
          updatedAt: old,
        });
      }
    });
    const { recoverStaleAudits } = await import("../audit-service");
    await expect(recoverStaleAudits()).resolves.toBe(2);
    const data = await readStore();
    expect(data.audits.every((audit) => audit.status === "failed")).toBe(true);
  });
});
