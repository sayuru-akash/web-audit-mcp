import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let dataDir: string;
const originalCwd = process.cwd();

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "web-audit-store-"));
  process.chdir(dataDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(dataDir, { recursive: true, force: true });
});

describe("store", () => {
  it("serializes concurrent mutations", async () => {
    const { id, updateStore } = await import("../store");
    await Promise.all(
      Array.from({ length: 10 }, async (_, index) =>
        updateStore((data) => {
          const ts = new Date().toISOString();
          data.users.push({
            id: id(),
            email: `user-${index}@example.com`,
            passwordHash: "hash",
            displayName: `User ${index}`,
            notifyOnAuditCompleted: true,
            notifyOnAuditFailed: true,
            notifyOnCriticalIssue: true,
            notifyOnScoreDrop: true,
            createdAt: ts,
            updatedAt: ts,
          });
        }),
      ),
    );
    const { readStore } = await import("../store");
    const data = await readStore();
    expect(data.users).toHaveLength(10);
  });
});
