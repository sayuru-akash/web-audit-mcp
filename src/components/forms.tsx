import type { ScheduleFrequency } from "@/lib/types";
import {
  addWebsiteAction,
  createShareAction,
  loginAction,
  revokeShareAction,
  runAuditAction,
  scheduleAction,
  signUpAction,
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
      <a className="muted" href="/signup">
        Create an account
      </a>
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

export function ShareButtons({ auditId, enabled }: { auditId: string; enabled: boolean }) {
  return enabled ? (
    <form action={revokeShareAction}>
      <input type="hidden" name="auditId" value={auditId} />
      <button className="danger" type="submit">
        Revoke share
      </button>
    </form>
  ) : (
    <form action={createShareAction}>
      <input type="hidden" name="auditId" value={auditId} />
      <button type="submit">Create share link</button>
    </form>
  );
}
