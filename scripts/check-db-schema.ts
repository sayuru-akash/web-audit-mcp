import { getTableName } from "drizzle-orm";
import {
  auditRuns,
  findings,
  metrics,
  notifications,
  passwordResetTokens,
  sessions,
  shareLinks,
  users,
  websites,
} from "../src/db/schema";

const tables = [auditRuns, findings, metrics, notifications, passwordResetTokens, sessions, shareLinks, users, websites];

if (tables.length < 9) {
  throw new Error(`Expected at least 9 database tables, found ${tables.length}.`);
}

console.log(JSON.stringify({ tables: tables.map((table) => getTableName(table)).sort() }, null, 2));
