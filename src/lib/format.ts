import { formatDistanceToNowStrict } from "date-fns";

export function timeAgo(iso?: string) {
  if (!iso) return "Not yet";
  return `${formatDistanceToNowStrict(new Date(iso))} ago`;
}

export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
