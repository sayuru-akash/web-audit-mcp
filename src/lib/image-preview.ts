import { assertPublicUrl, MAX_REDIRECTS, safeRedirectTarget } from "@/lib/url";

const IMAGE_PREVIEW_TIMEOUT_MS = 8_000;
const MAX_IMAGE_PREVIEW_BYTES = 2_000_000;
const IMAGE_PREVIEW_USER_AGENT = "WebAuditBot/0.1 (+https://webaudit.local; evidence image preview)";

export type ImagePreviewResult = {
  bytes: Uint8Array;
  contentType: string;
  finalUrl: string;
};

export function isPreviewableImageType(contentType: string) {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return /^(image\/avif|image\/gif|image\/jpeg|image\/png|image\/svg\+xml|image\/webp|image\/x-icon)$/.test(normalized);
}

async function fetchPreviewOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_PREVIEW_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        accept: "image/avif,image/webp,image/svg+xml,image/*,*/*;q=0.8",
        "user-agent": IMAGE_PREVIEW_USER_AGENT,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchImagePreview(url: string, redirects = 0): Promise<ImagePreviewResult> {
  const safe = await assertPublicUrl(url);
  const response = await fetchPreviewOnce(safe.normalizedUrl);

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location");
    if (!location) throw new Error("Image preview redirect did not include a destination.");
    if (redirects >= MAX_REDIRECTS) throw new Error(`Image preview exceeded the ${MAX_REDIRECTS} redirect limit.`);
    const target = await safeRedirectTarget(safe.normalizedUrl, location);
    return fetchImagePreview(target.normalizedUrl, redirects + 1);
  }

  if (!response.ok) throw new Error(`Image preview failed with HTTP ${response.status}.`);

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_PREVIEW_BYTES) {
    throw new Error("Image preview is larger than the safety limit.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!isPreviewableImageType(contentType)) {
    throw new Error("Referenced URL is not a previewable image.");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_PREVIEW_BYTES) {
    throw new Error("Image preview is larger than the safety limit.");
  }

  return {
    bytes,
    contentType: contentType.split(";")[0]?.trim().toLowerCase() ?? "application/octet-stream",
    finalUrl: safe.normalizedUrl,
  };
}
