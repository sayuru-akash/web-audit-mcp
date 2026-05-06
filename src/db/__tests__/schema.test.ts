import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
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
} from "../schema";

describe("database schema", () => {
  it("defines the production persistence tables", () => {
    const tables = [
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
    ]
      .map((table) => getTableName(table))
      .sort();
    expect(tables).toEqual([
      "audit_runs",
      "findings",
      "metrics",
      "notifications",
      "password_reset_tokens",
      "rate_limits",
      "sessions",
      "share_links",
      "users",
      "websites",
    ]);
  });
});
