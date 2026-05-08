import { jsonStoreAdapter } from "@/lib/persistence/json-store";
import { postgresStoreAdapter } from "@/lib/persistence/postgres-store";

export function getStoreAdapter() {
  if (process.env.DATABASE_URL) {
    return postgresStoreAdapter;
  }
  return jsonStoreAdapter;
}

export const storeAdapter = getStoreAdapter();
