import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

let client: ReturnType<typeof postgres> | undefined;

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured. The app will use the local JSON store unless a Postgres adapter is enabled.");
  }
  client ??= postgres(databaseUrl, { max: 10 });
  return drizzle(client, { schema });
}

export async function closeDatabase() {
  await client?.end();
  client = undefined;
}
