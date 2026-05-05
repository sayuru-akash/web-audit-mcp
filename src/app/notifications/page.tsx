import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MarkNotificationsReadForm } from "@/components/forms";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/store";
import { timeAgo } from "@/lib/format";

export default async function NotificationsPage() {
  const user = await requireUser();
  const { notifications } = await getUserDashboard(user.id);
  return (
    <AppShell user={user} title="Notifications" subtitle="Audit completion, failure, score drop, and critical issue alerts.">
      <div className="actions" style={{ marginBottom: 18 }}>
        <MarkNotificationsReadForm />
      </div>
      <div className="grid">
        {notifications.map((notification) => (
          <Link className="card" href={notification.auditRunId ? `/audits/${notification.auditRunId}` : "/dashboard"} key={notification.id}>
            <div className="actions" style={{ justifyContent: "space-between" }}>
              <strong>{notification.title}</strong>
              <span className={notification.read ? "badge" : "badge completed"}>
                {notification.read ? timeAgo(notification.createdAt) : "unread"}
              </span>
            </div>
            <p className="muted">{notification.message}</p>
          </Link>
        ))}
        {notifications.length === 0 ? <div className="card muted">No notifications yet.</div> : null}
      </div>
    </AppShell>
  );
}
