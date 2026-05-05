import type { ScheduleFrequency } from "@/lib/types";
import {
  addWebsiteAction,
  changePasswordAction,
  deleteAccountAction,
  deleteWebsiteAction,
  loginAction,
  markNotificationsReadAction,
  requestPasswordResetAction,
  resetPasswordAction,
  runAuditAction,
  scheduleAction,
  signUpAction,
  updateNotificationPreferencesAction,
  updateProfileAction,
  updateWebsiteAction,
} from "@/lib/actions";

export function AddWebsiteForm() {
  return (
    <form className="form card" action={addWebsiteAction}>
      <div className="field">
        <label htmlFor="url">Website URL</label>
        <input id="url" name="url" placeholder="https://example.com" required />
      </div>
      <div className="field">
        <label htmlFor="displayName">Website name</label>
        <input id="displayName" name="displayName" placeholder="Optional" />
      </div>
      <button className="primary" type="submit">
        Add website
      </button>
    </form>
  );
}

export function RunAuditButton({ websiteId }: { websiteId: string }) {
  return (
    <form action={runAuditAction}>
      <input type="hidden" name="websiteId" value={websiteId} />
      <button className="primary" type="submit">
        Run audit
      </button>
    </form>
  );
}

export function LoginForm() {
  return (
    <form className="form card auth-card" action={loginAction}>
      <div>
        <h1 className="page-title">Log in</h1>
        <p className="page-subtitle">Continue to your website audits.</p>
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      <button className="primary" type="submit">
        Log in
      </button>
      <a className="muted" href="/forgot-password">
        Forgot password?
      </a>
      <a className="muted" href="/signup">
        Create an account
      </a>
    </form>
  );
}

export function ForgotPasswordForm({ sent, devToken }: { sent?: boolean; devToken?: string }) {
  return (
    <div className="card auth-card">
      <form className="form" action={requestPasswordResetAction}>
        <div>
          <h1 className="page-title">Reset password</h1>
          <p className="page-subtitle">If the account exists, a reset token will be created.</p>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <button className="primary" type="submit">
          Request reset
        </button>
      </form>
      {sent ? (
        <p className="muted">
          Reset requested. Configure email delivery in production. Local token display is only available when
          `WEB_AUDIT_DEV_RESET_TOKENS=true`.
        </p>
      ) : null}
      {devToken ? <pre>{devToken}</pre> : null}
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <form className="form card auth-card" action={resetPasswordAction}>
      <div>
        <h1 className="page-title">Set new password</h1>
        <p className="page-subtitle">Use the reset token from your configured email flow.</p>
      </div>
      <div className="field">
        <label htmlFor="token">Reset token</label>
        <input id="token" name="token" required />
      </div>
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" minLength={10} required />
      </div>
      <button className="primary" type="submit">
        Update password
      </button>
    </form>
  );
}

export function SignUpForm() {
  return (
    <form className="form card auth-card" action={signUpAction}>
      <div>
        <h1 className="page-title">Create account</h1>
        <p className="page-subtitle">Run audits, save history, and share reports.</p>
      </div>
      <div className="field">
        <label htmlFor="displayName">Name</label>
        <input id="displayName" name="displayName" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" minLength={10} required />
      </div>
      <button className="primary" type="submit">
        Sign up
      </button>
      <a className="muted" href="/login">
        Log in instead
      </a>
    </form>
  );
}

export function ScheduleForm({
  websiteId,
  frequency,
  threshold,
}: {
  websiteId: string;
  frequency: ScheduleFrequency;
  threshold: number;
}) {
  return (
    <form className="form card" action={scheduleAction}>
      <input type="hidden" name="websiteId" value={websiteId} />
      <div className="field">
        <label htmlFor="frequency">Audit schedule</label>
        <select id="frequency" name="frequency" defaultValue={frequency}>
          <option value="manual">Manual only</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="alertThreshold">Score drop alert</label>
        <input id="alertThreshold" name="alertThreshold" type="number" min="1" max="50" defaultValue={threshold} />
      </div>
      <button type="submit">Save schedule</button>
    </form>
  );
}

export function EditWebsiteForm({ websiteId, displayName }: { websiteId: string; displayName: string }) {
  return (
    <form className="form card" action={updateWebsiteAction}>
      <input type="hidden" name="websiteId" value={websiteId} />
      <div className="field">
        <label htmlFor="displayName">Website name</label>
        <input id="displayName" name="displayName" defaultValue={displayName} minLength={2} maxLength={120} required />
      </div>
      <button type="submit">Save website</button>
    </form>
  );
}

export function DeleteWebsiteForm({ websiteId }: { websiteId: string }) {
  return (
    <form className="form card" action={deleteWebsiteAction}>
      <input type="hidden" name="websiteId" value={websiteId} />
      <p className="muted">Deleting a website also removes its audits, metrics, findings, notifications, and share links.</p>
      <button className="danger" type="submit">
        Delete website
      </button>
    </form>
  );
}

export function MarkNotificationsReadForm() {
  return (
    <form action={markNotificationsReadAction}>
      <button type="submit">Mark all read</button>
    </form>
  );
}

export function DeleteAccountForm({ email }: { email: string }) {
  return (
    <form className="form card" action={deleteAccountAction}>
      <div className="field">
        <label htmlFor="confirm">Type your email to delete</label>
        <input id="confirm" name="confirm" placeholder={email} />
      </div>
      <button className="danger" type="submit">
        Delete account and data
      </button>
    </form>
  );
}

export function ProfileForm({ displayName }: { displayName: string }) {
  return (
    <form className="form card" action={updateProfileAction}>
      <h2>Profile</h2>
      <div className="field">
        <label htmlFor="displayName">Display name</label>
        <input id="displayName" name="displayName" defaultValue={displayName} minLength={2} maxLength={80} required />
      </div>
      <button type="submit">Save profile</button>
    </form>
  );
}

export function ChangePasswordForm() {
  return (
    <form className="form card" action={changePasswordAction}>
      <h2>Change password</h2>
      <div className="field">
        <label htmlFor="currentPassword">Current password</label>
        <input id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" minLength={10} required />
      </div>
      <button type="submit">Update password</button>
    </form>
  );
}

export function NotificationPreferencesForm({
  completed,
  failed,
  critical,
  scoreDrop,
}: {
  completed: boolean;
  failed: boolean;
  critical: boolean;
  scoreDrop: boolean;
}) {
  return (
    <form className="form card" action={updateNotificationPreferencesAction}>
      <h2>Notifications</h2>
      {[
        ["notifyOnAuditCompleted", "Audit completed", completed],
        ["notifyOnAuditFailed", "Audit failed", failed],
        ["notifyOnCriticalIssue", "Critical issue found", critical],
        ["notifyOnScoreDrop", "Score dropped", scoreDrop],
      ].map(([name, label, checked]) => (
        <label className="actions" key={String(name)}>
          <input name={String(name)} type="checkbox" defaultChecked={Boolean(checked)} />
          <span>{String(label)}</span>
        </label>
      ))}
      <button type="submit">Save notifications</button>
    </form>
  );
}
