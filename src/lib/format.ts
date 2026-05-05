import { formatDistanceToNowStrict } from "date-fns";

export function timeAgo(iso?: string) {
  if (!iso) return "Not yet";
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export function absoluteUrlFromOrigin(path: string, origin?: string) {
  return new URL(path, origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString();
}

export function requestOrigin(headersList: Headers) {
  const forwardedHost = headersList.get("x-forwarded-host");
  const host = forwardedHost ?? headersList.get("host");
  if (!host) return process.env.NEXT_PUBLIC_APP_URL;
  const forwardedProto = headersList.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}
