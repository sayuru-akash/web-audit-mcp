"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSessionCookie, createSession, hashPassword, loginSchema, requireUser, setSessionCookie, signUpSchema, verifyPassword } from "@/lib/auth";
import { addWebsiteForUser, createOrToggleShare, runAuditForWebsite, updateSchedule } from "@/lib/audit-service";
import { id, nowIso, updateStore } from "@/lib/store";
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
  const user = await updateStore((data) => {
    if (data.users.some((item) => item.email === parsed.email)) throw new Error("Use the login form for this email.");
    const ts = nowIso();
    const created = {
      id: id(),
      email: parsed.email,
      displayName: parsed.displayName,
      passwordHash: hashPassword(parsed.password),
      createdAt: ts,
      updatedAt: ts,
    };
    data.users.push(created);
    return created;
  });
  await setSessionCookie(await createSession(user.id));
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.parse({
    email: value(formData, "email").toLowerCase(),
    password: value(formData, "password"),
  });
  const user = await updateStore((data) => data.users.find((item) => item.email === parsed.email));
  if (!user || !verifyPassword(parsed.password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }
  await setSessionCookie(await createSession(user.id));
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function addWebsiteAction(formData: FormData) {
  const user = await requireUser();
  const website = await addWebsiteForUser(user.id, value(formData, "url"), value(formData, "displayName"));
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

export async function createShareAction(formData: FormData) {
  const user = await requireUser();
  const auditId = value(formData, "auditId");
  await createOrToggleShare(user.id, auditId, true);
  revalidatePath(`/audits/${auditId}`);
  redirect(`/audits/${auditId}`);
}

export async function revokeShareAction(formData: FormData) {
  const user = await requireUser();
  const auditId = value(formData, "auditId");
  await createOrToggleShare(user.id, auditId, false);
  revalidatePath(`/audits/${auditId}`);
  redirect(`/audits/${auditId}`);
}
