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
} from "../src/db/schema";

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
];

if (tables.length < 10) {
  throw new Error(`Expected at least 10 database tables, found ${tables.length}.`);
}

console.log(JSON.stringify({ tables: tables.map((table) => getTableName(table)).sort() }, null, 2));
