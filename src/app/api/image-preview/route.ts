import { NextResponse } from "next/server";
import { fetchImagePreview } from "@/lib/image-preview";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing image URL." }, { status: 400 });

  try {
    const preview = await fetchImagePreview(url);
    return new NextResponse(new Blob([Buffer.from(preview.bytes)], { type: preview.contentType }), {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": "inline",
        "Content-Security-Policy": "default-src 'none'; script-src 'none'; sandbox",
        "Content-Type": preview.contentType,
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Image-Preview-Source": preview.finalUrl,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Image preview failed." }, { status: 422 });
  }
}
