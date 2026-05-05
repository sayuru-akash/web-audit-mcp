import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured. The app will use the local JSON store unless a Postgres adapter is enabled.");
  }
  return drizzle(neon(databaseUrl), { schema });
}
