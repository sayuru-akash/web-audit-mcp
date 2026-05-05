import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getOperationalHealth } from "@/lib/audit-service";
import { getStoreHealth } from "@/lib/store";

export async function GET() {
  await requireAdmin();
  const health = await getOperationalHealth();
  const store = await getStoreHealth();
  return NextResponse.json({
    ok: true,
    ...health,
    store,
  });
}
