import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { z } from "zod";

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
];

const BLOCKED_HOSTS = new Set(["localhost", "0.0.0.0", "::1"]);

export const websiteUrlSchema = z
  .string()
  .trim()
  .min(4, "Enter a website URL.")
  .max(2048, "URL is too long.");

export type SafeUrl = {
  originalUrl: string;
  normalizedUrl: string;
  domain: string;
};

export const MAX_REDIRECTS = 5;

export function normalizeWebsiteUrl(input: string): SafeUrl {
  const parsedInput = websiteUrlSchema.parse(input);
  const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(parsedInput);
  const withProtocol = hasProtocol ? parsedInput : `https://${parsedInput}`;
  const url = new URL(withProtocol);
  url.hash = "";
  url.username = "";
  url.password = "";
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs can be audited.");
  }
  if (!url.hostname.includes(".") && !isIP(url.hostname)) {
    throw new Error("Enter a public website domain.");
  }
  if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Local and private network addresses are blocked.");
  }
  if (url.pathname === "/") url.pathname = "";
  return {
    originalUrl: parsedInput,
    normalizedUrl: url.toString(),
    domain: url.hostname.toLowerCase(),
  };
}

export function isPrivateIp(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return PRIVATE_V4.some((pattern) => pattern.test(address));
  if (family === 6) {
    const lower = address.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:");
  }
  return false;
}

export async function assertPublicUrl(urlInput: string): Promise<SafeUrl> {
  const safe = normalizeWebsiteUrl(urlInput);
  const records = await lookup(safe.domain, { all: true, verbatim: false });
  if (records.length === 0 || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("This URL resolves to a private or internal network address, so it was blocked.");
  }
  return safe;
}

export async function safeRedirectTarget(currentUrl: string, location: string): Promise<SafeUrl> {
  const resolved = new URL(location, currentUrl).toString();
  return assertPublicUrl(resolved);
}

export function sameOriginInternalLinks(baseUrl: string, hrefs: string[], limit: number): string[] {
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  for (const href of hrefs) {
    try {
      const next = new URL(href, base);
      next.hash = "";
      if (next.origin === base.origin && !seen.has(next.toString())) seen.add(next.toString());
      if (seen.size >= limit) break;
    } catch {
      // Ignore malformed page links; they are reported by higher-level checks.
    }
  }
  return [...seen];
}
