import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <AppShell user={user} title="Settings" subtitle="Profile, security, notifications, and account controls.">
      <div className="grid cols-2">
        <section className="card">
          <h2>Profile</h2>
          <p className="muted">{user.displayName}</p>
          <p className="muted">{user.email}</p>
        </section>
        <section className="card">
          <h2>Security</h2>
          <p className="muted">Sessions use HTTP-only cookies and scrypt password hashing.</p>
        </section>
        <section className="card">
          <h2>Notifications</h2>
          <p className="muted">In-app alerts are enabled for audit completion, failures, critical issues, and score drops.</p>
        </section>
        <section className="card">
          <h2>Account deletion</h2>
          <p className="muted">Deletion is intentionally explicit. Export any reports you need before removing data.</p>
        </section>
      </div>
    </AppShell>
  );
}
