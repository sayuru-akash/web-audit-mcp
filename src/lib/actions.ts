"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  clearSessionCookie,
  changePasswordSchema,
  createSession,
  createPasswordResetToken,
  hashPassword,
  loginSchema,
  profileSchema,
  resetPasswordSchema,
  resetPasswordWithToken,
  resetRequestSchema,
  requireUser,
  setSessionCookie,
  signUpSchema,
  verifyPassword,
} from "@/lib/auth";
import {
  addWebsiteForUser,
  createOrToggleShare,
  deleteAccountForUser,
  deleteWebsiteForUser,
  runAuditForWebsite,
  updateSchedule,
  updateWebsiteDetails,
} from "@/lib/audit-service";
import { storeAdapter } from "@/lib/persistence";
import { id, nowIso } from "@/lib/store";
import type { ScheduleFrequency } from "@/lib/types";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.parse({
    displayName: value(formData, "displayName"),
    email: value(formData, "email").toLowerCase(),
    password: value(formData, "password"),
  });
  const allowed = await storeAdapter.checkRateLimit(
    `auth-signup:${parsed.email}`,
    5,
    60 * 60 * 1000,
  );
  if (!allowed)
    throw new Error("Too many sign-up attempts. Please try again later.");
  const existing = await storeAdapter.getUserByEmail(parsed.email);
  if (existing) throw new Error("Use the login form for this email.");
  const ts = nowIso();
  const user = await storeAdapter.createUser({
    id: id(),
    email: parsed.email,
    displayName: parsed.displayName,
    passwordHash: hashPassword(parsed.password),
    notifyOnAuditCompleted: true,
    notifyOnAuditFailed: true,
    notifyOnCriticalIssue: true,
    notifyOnScoreDrop: true,
    createdAt: ts,
    updatedAt: ts,
  });
  await setSessionCookie(await createSession(user.id));
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.parse({
    email: value(formData, "email").toLowerCase(),
    password: value(formData, "password"),
  });
  const allowed = await storeAdapter.checkRateLimit(
    `auth-login:${parsed.email}`,
    10,
    15 * 60 * 1000,
  );
  if (!allowed)
    throw new Error("Too many login attempts. Please try again later.");
  const user = await storeAdapter.getUserByEmail(parsed.email);
  if (!user || !verifyPassword(parsed.password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }
  await setSessionCookie(await createSession(user.id));
  redirect("/dashboard");
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = resetRequestSchema.parse({
    email: value(formData, "email").toLowerCase(),
  });
  const allowed = await storeAdapter.checkRateLimit(
    `password-reset:${parsed.email}`,
    3,
    60 * 60 * 1000,
  );
  if (!allowed)
    throw new Error("Too many reset attempts. Please try again later.");
  const devToken = await createPasswordResetToken(parsed.email);
  const target = devToken
    ? `/forgot-password?sent=1&devToken=${encodeURIComponent(devToken)}`
    : "/forgot-password?sent=1";
  redirect(target);
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.parse({
    token: value(formData, "token"),
    password: value(formData, "password"),
  });
  await resetPasswordWithToken(parsed.token, parsed.password);
  redirect("/login?reset=1");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function addWebsiteAction(formData: FormData) {
  const user = await requireUser();
  const website = await addWebsiteForUser(
    user.id,
    value(formData, "url"),
    value(formData, "displayName"),
  );
  revalidatePath("/websites");
  redirect(`/websites/${website.id}`);
}

export async function runAuditAction(formData: FormData) {
  const user = await requireUser();
  const audit = await runAuditForWebsite(user.id, value(formData, "websiteId"));
  revalidatePath("/dashboard");
  revalidatePath("/audits");
  redirect(`/audits/${audit.id}`);
}

export async function scheduleAction(formData: FormData) {
  const user = await requireUser();
  const websiteId = value(formData, "websiteId");
  const frequency = value(formData, "frequency") as ScheduleFrequency;
  const threshold = Number(value(formData, "alertThreshold") || 10);
  await updateSchedule(user.id, websiteId, frequency, threshold);
  revalidatePath(`/websites/${websiteId}`);
  redirect(`/websites/${websiteId}`);
}

export async function updateWebsiteAction(formData: FormData) {
  const user = await requireUser();
  const websiteId = value(formData, "websiteId");
  await updateWebsiteDetails(
    user.id,
    websiteId,
    value(formData, "displayName"),
  );
  revalidatePath(`/websites/${websiteId}`);
  redirect(`/websites/${websiteId}`);
}

export async function deleteWebsiteAction(formData: FormData) {
  const user = await requireUser();
  await deleteWebsiteForUser(user.id, value(formData, "websiteId"));
  revalidatePath("/websites");
  redirect("/websites");
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await storeAdapter.updateStore((data) => {
    for (const notification of data.notifications) {
      if (notification.userId === user.id) notification.read = true;
    }
  });
  revalidatePath("/notifications");
  redirect("/notifications");
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  if (value(formData, "confirm") !== user.email) {
    throw new Error("Type your email address to delete this account.");
  }
  await deleteAccountForUser(user.id);
  await clearSessionCookie();
  redirect("/");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.parse({
    displayName: value(formData, "displayName"),
  });
  await storeAdapter.updateUser(user.id, {
    displayName: parsed.displayName,
    updatedAt: nowIso(),
  });
  revalidatePath("/settings");
  redirect("/settings");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const parsed = changePasswordSchema.parse({
    currentPassword: value(formData, "currentPassword"),
    password: value(formData, "password"),
  });
  const account = await storeAdapter.getUserByEmail(user.email);
  if (
    !account ||
    !verifyPassword(parsed.currentPassword, account.passwordHash)
  ) {
    throw new Error("Current password is incorrect.");
  }
  await storeAdapter.updateUser(user.id, {
    passwordHash: hashPassword(parsed.password),
    updatedAt: nowIso(),
  });
  await storeAdapter.deleteSessionsForUser(user.id);
  await clearSessionCookie();
  redirect("/login");
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const user = await requireUser();
  await storeAdapter.updateUser(user.id, {
    notifyOnAuditCompleted: formData.get("notifyOnAuditCompleted") === "on",
    notifyOnAuditFailed: formData.get("notifyOnAuditFailed") === "on",
    notifyOnCriticalIssue: formData.get("notifyOnCriticalIssue") === "on",
    notifyOnScoreDrop: formData.get("notifyOnScoreDrop") === "on",
    updatedAt: nowIso(),
  });
  revalidatePath("/settings");
  redirect("/settings");
}

export async function createShareAction(formData: FormData) {
  const user = await requireUser();
  const auditId = value(formData, "auditId");
  await createOrToggleShare(user.id, auditId, true);
  revalidatePath(`/audits/${auditId}`);
  redirect(`/audits/${auditId}?share=created`);
}

export async function revokeShareAction(formData: FormData) {
  const user = await requireUser();
  const auditId = value(formData, "auditId");
  await createOrToggleShare(user.id, auditId, false);
  revalidatePath(`/audits/${auditId}`);
  redirect(`/audits/${auditId}`);
}
