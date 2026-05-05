import { AppShell } from "@/components/app-shell";
import {
  ChangePasswordForm,
  DeleteAccountForm,
  NotificationPreferencesForm,
  ProfileForm,
} from "@/components/forms";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <AppShell user={user} title="Settings" subtitle="Profile, security, notifications, and account controls.">
      <div className="grid cols-2">
        <ProfileForm displayName={user.displayName} />
        <section className="card">
          <h2>Security</h2>
          <p className="muted">Sessions use HTTP-only cookies and scrypt password hashing.</p>
          <p className="muted">{user.email}</p>
        </section>
        <ChangePasswordForm />
        <NotificationPreferencesForm
          completed={user.notifyOnAuditCompleted ?? true}
          failed={user.notifyOnAuditFailed ?? true}
          critical={user.notifyOnCriticalIssue ?? true}
          scoreDrop={user.notifyOnScoreDrop ?? true}
        />
        <section className="card">
          <h2>Account deletion</h2>
          <p className="muted">Deletion is intentionally explicit. Export any reports you need before removing data.</p>
        </section>
        <DeleteAccountForm email={user.email} />
      </div>
    </AppShell>
  );
}
