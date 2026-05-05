import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MarkNotificationsReadForm } from "@/components/forms";
import { paginate, Pagination } from "@/components/pagination";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/store";
import { timeAgo } from "@/lib/format";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const { notifications } = await getUserDashboard(user.id);
  const filter = query.filter === "unread" ? "unread" : query.filter === "critical" ? "critical" : "";
  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((notification) => !notification.read)
      : filter === "critical"
        ? notifications.filter((notification) => notification.type === "critical_issue")
        : notifications;
  const page = Number(query.page ?? "1");
  const { currentPage, totalPages, pageItems, totalItems } = paginate(
    filteredNotifications,
    Number.isFinite(page) ? page : 1,
    8,
  );
  return (
    <AppShell user={user} title="Notifications" subtitle="Audit completion, failure, score drop, and critical issue alerts.">
      <div className="list-toolbar">
        <div>
          <strong>{totalItems} notification{totalItems === 1 ? "" : "s"}</strong>
          <p className="muted">Unread and critical alerts stay easy to isolate.</p>
        </div>
        <div className="segmented" aria-label="Notification filter">
          {[
            ["", "All"],
            ["unread", "Unread"],
            ["critical", "Critical"],
          ].map(([value, label]) => (
            <Link className={filter === value ? "active" : ""} href={value ? `/notifications?filter=${value}` : "/notifications"} key={value}>
              {label}
            </Link>
          ))}
        </div>
        <MarkNotificationsReadForm />
      </div>
      <div className="grid">
        {pageItems.map((notification) => (
          <Link className={`card notification-card ${notification.read ? "" : "unread"}`} href={notification.auditRunId ? `/audits/${notification.auditRunId}` : "/dashboard"} key={notification.id}>
            <div className="actions" style={{ justifyContent: "space-between" }}>
              <div className="actions">
                <span className={`notification-dot ${notification.type}`} aria-hidden="true" />
                <strong>{notification.title}</strong>
              </div>
              <span className={notification.read ? "badge" : "badge completed"}>
                {notification.read ? timeAgo(notification.createdAt) : "unread"}
              </span>
            </div>
            <p className="muted">{notification.message}</p>
          </Link>
        ))}
        {pageItems.length === 0 ? <div className="card muted">No notifications match this filter.</div> : null}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/notifications" params={{ filter }} />
    </AppShell>
  );
}
