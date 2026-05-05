const PLACEHOLDER_CRON_SECRET = new Set(["replace-for-production", "changeme", "change-me", "secret"]);
const PLACEHOLDER_ADMIN_EMAILS = new Set(["admin@example.com", ""]);

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function isDevResetTokenDisplayEnabled() {
  return !isProduction() && process.env.WEB_AUDIT_DEV_RESET_TOKENS === "true";
}

export function validateProductionRuntimeConfig() {
  if (!isProduction()) return;
  getCronSecret();
  getAdminEmails();
  if (process.env.WEB_AUDIT_DEV_RESET_TOKENS === "true") {
    throw new Error("WEB_AUDIT_DEV_RESET_TOKENS cannot be enabled in production.");
  }
}

export function getCronSecret() {
  const cronSecret = process.env.CRON_SECRET ?? "";
  if (!isProduction()) return cronSecret;
  if (cronSecret.length < 24 || PLACEHOLDER_CRON_SECRET.has(cronSecret.toLowerCase())) {
    throw new Error("CRON_SECRET must be a strong non-placeholder value in production.");
  }
  return cronSecret;
}

export function getAdminEmails() {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!isProduction()) return adminEmails;
  if (adminEmails.length === 0 || adminEmails.some((email) => PLACEHOLDER_ADMIN_EMAILS.has(email))) {
    throw new Error("ADMIN_EMAILS must contain real operator emails in production.");
  }
  return adminEmails;
}
