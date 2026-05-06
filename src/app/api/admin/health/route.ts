import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getOperationalHealth } from "@/lib/audit-service";
import { storeAdapter } from "@/lib/persistence";

export async function GET() {
  await requireAdmin();
  const health = await getOperationalHealth();
  const store = await storeAdapter.getStoreHealth();
  return NextResponse.json({
    ok: true,
    ...health,
    store,
  });
}
