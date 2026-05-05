import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { findUserBySession, id, nowIso, updateStore } from "@/lib/store";
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
  await updateStore((data) => {
    const user = data.users.find((item) => item.email === email);
    if (!user) return;
    data.passwordResetTokens = data.passwordResetTokens.filter((item) => item.userId !== user.id && !item.usedAt);
    const createdAt = nowIso();
    data.passwordResetTokens.push({
      id: id(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      createdAt,
    });
  });
  return process.env.WEB_AUDIT_DEV_RESET_TOKENS === "true" ? token : undefined;
}

export async function resetPasswordWithToken(token: string, password: string): Promise<void> {
  const tokenHash = hashToken(token);
  await updateStore((data) => {
    const resetToken = data.passwordResetTokens.find(
      (item) => item.tokenHash === tokenHash && !item.usedAt && Date.parse(item.expiresAt) > Date.now(),
    );
    if (!resetToken) throw new Error("Reset token is invalid or expired.");
    const user = data.users.find((item) => item.id === resetToken.userId);
    if (!user) throw new Error("Account not found.");
    user.passwordHash = hashPassword(password);
    user.updatedAt = nowIso();
    resetToken.usedAt = nowIso();
    data.sessions = data.sessions.filter((session) => session.userId !== user.id);
  });
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  await updateStore((data) => {
    const createdAt = nowIso();
    data.sessions.push({
      id: id(),
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      createdAt,
    });
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
    await updateStore((data) => {
      data.sessions = data.sessions.filter((session) => session.tokenHash !== tokenHash);
    });
  }
  jar.delete(sessionCookieName);
}

export async function currentUser(): Promise<User | undefined> {
  const jar = await cookies();
  const token = jar.get(sessionCookieName)?.value;
  if (!token) return undefined;
  return findUserBySession(hashToken(token));
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0 && process.env.NODE_ENV !== "development") {
    throw new Error("Admin access is not configured.");
  }
  if (process.env.NODE_ENV === "development" && adminEmails.length === 0) return user;
  if (!adminEmails.includes(user.email.toLowerCase())) {
    throw new Error("You do not have access to this admin area.");
  }
  return user;
}

export async function optionalDemoUser(): Promise<User> {
  const user = await currentUser();
  if (user) return user;
  return updateStore((data) => {
    let demo = data.users.find((item) => item.email === "demo@webaudit.local");
    if (!demo) {
      const ts = nowIso();
      demo = {
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
      };
      data.users.push(demo);
    }
    return demo;
  });
}
