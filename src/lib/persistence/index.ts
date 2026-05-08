import { jsonStoreAdapter } from "@/lib/persistence/json-store";
import { postgresStoreAdapter } from "@/lib/persistence/postgres-store";

export function getStoreAdapter() {
  if (process.env.WEB_AUDIT_STORE === "postgres") {
    return postgresStoreAdapter;
  }
  return jsonStoreAdapter;
}

export const storeAdapter = getStoreAdapter();
