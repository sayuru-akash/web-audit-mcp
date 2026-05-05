import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export async function GET() {
  const data = await readStore();
  return NextResponse.json({
    ok: true,
    users: data.users.length,
    websites: data.websites.length,
    audits: data.audits.length,
    openJobs: data.audits.filter((audit) => audit.status === "queued" || audit.status === "running").length,
  });
}
