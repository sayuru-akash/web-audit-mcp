import { NextResponse } from "next/server";
import { z } from "zod";
import { runPageAudit } from "@/lib/audit-engine";
import { checkRateLimit } from "@/lib/store";

const bodySchema = z.object({ url: z.string().min(1) });

export async function POST(request: Request) {
  const body = bodySchema.parse(await request.json());
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const allowed = await checkRateLimit(`public-audit:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Audit limit reached." }, { status: 429 });
  const result = await runPageAudit(body.url);
  return NextResponse.json(result);
}
