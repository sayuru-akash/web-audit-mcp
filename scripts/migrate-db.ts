import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required. Example: DATABASE_URL=postgresql://localhost:5432/web_audit_mcp npm run db:migrate");
  process.exit(1);
}

const migrations = [
  "0001_initial.sql",
  "0002_add_needs_review_finding_status.sql",
  "0003_add_rate_limits.sql",
];

const sql = postgres(databaseUrl, { max: 1 });

try {
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;

  const applied = new Set((await sql<{ name: string }[]>`SELECT name FROM schema_migrations`).map((row) => row.name));
  const appliedNow: string[] = [];

  for (const migration of migrations) {
    if (applied.has(migration)) continue;
    const body = await readFile(path.join(process.cwd(), "migrations", migration), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (name) VALUES (${migration})`;
    });
    appliedNow.push(migration);
  }

  console.log(JSON.stringify({ ok: true, applied: appliedNow }, null, 2));
} finally {
  await sql.end();
}
