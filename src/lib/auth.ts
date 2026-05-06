import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { storeAdapter } from "@/lib/persistence";
import { id, nowIso } from "@/lib/store";
import { getAdminEmails, isDevResetTokenDisplayEnabled, isProduction } from "@/lib/runtime-config";
import type { User } from "@/lib/types";

export const sessionCookieName = "web_audit_session";

export const signUpSchema = z.object({
  displayName: z.string().trim().min(2, "Name is too short.").max(80, "Name is too long."),
  email: z.string().trim().email("Enter a valid email.").max(254),
  password: z.string().min(10, "Use at least 10 characters.").max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});

export const resetRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email.").max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(24, "Enter the reset token."),
  password: z.string().min(10, "Use at least 10 characters.").max(128),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Name is too short.").max(80, "Name is too long."),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(128),
  password: z.string().min(10, "Use at least 10 characters.").max(128),
});

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored === "demo") return password === "demo-password";
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = Buffer.from(scryptSync(password, salt, 64).toString("hex"));
  const expected = Buffer.from(hash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(email: string): Promise<string | undefined> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const user = await storeAdapter.getUserByEmail(email);
  if (user) {
    const createdAt = nowIso();
    await storeAdapter.createPasswordResetToken({
      id: id(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      createdAt,
    });
  }
  return isDevResetTokenDisplayEnabled() ? token : undefined;
}

export async function resetPasswordWithToken(token: string, password: string): Promise<void> {
  const tokenHash = hashToken(token);
  const resetToken = await storeAdapter.getValidPasswordResetToken(tokenHash);
  if (!resetToken) throw new Error("Reset token is invalid or expired.");
  await storeAdapter.updateUser(resetToken.userId, {
    passwordHash: hashPassword(password),
    updatedAt: nowIso(),
  });
  await storeAdapter.markPasswordResetTokenUsed(resetToken.id, nowIso());
  await storeAdapter.deleteSessionsForUser(resetToken.userId);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const createdAt = nowIso();
  await storeAdapter.createSession({
    id: id(),
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    createdAt,
  });
  return token;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  const token = jar.get(sessionCookieName)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await storeAdapter.deleteSessionByTokenHash(tokenHash);
  }
  jar.delete(sessionCookieName);
}

export async function currentUser(): Promise<User | undefined> {
  const jar = await cookies();
  const token = jar.get(sessionCookieName)?.value;
  if (!token) return undefined;
  return storeAdapter.findUserBySession(hashToken(token));
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0 && isProduction()) {
    throw new Error("Admin access is not configured.");
  }
  if (!isProduction() && adminEmails.length === 0) return user;
  if (!adminEmails.includes(user.email.toLowerCase())) {
    throw new Error("You do not have access to this admin area.");
  }
  return user;
}

export async function optionalDemoUser(): Promise<User> {
  const user = await currentUser();
  if (user) return user;
  const existing = await storeAdapter.getUserByEmail("demo@webaudit.local");
  if (existing) return existing;
  const ts = nowIso();
  return storeAdapter.createUser({
    id: id(),
    email: "demo@webaudit.local",
    passwordHash: "demo",
    displayName: "Demo User",
    notifyOnAuditCompleted: true,
    notifyOnAuditFailed: true,
    notifyOnCriticalIssue: true,
    notifyOnScoreDrop: true,
    createdAt: ts,
    updatedAt: ts,
  });
}
