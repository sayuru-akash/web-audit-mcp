import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ScoreText } from "@/components/score";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/store";
import { timeAgo } from "@/lib/format";

export default async function AuditsPage() {
  const user = await requireUser();
  const { audits, websites } = await getUserDashboard(user.id);
  return (
    <AppShell user={user} title="Audits" subtitle="Saved report history across every website.">
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Status</th>
              <th>Score</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((audit) => {
              const website = websites.find((item) => item.id === audit.websiteId);
              return (
                <tr key={audit.id}>
                  <td>
                    <Link href={`/audits/${audit.id}`}>
                      <strong>{website?.displayName ?? "Website"}</strong>
                      <div className="muted">{audit.finalUrl ?? audit.requestedUrl}</div>
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${audit.status}`}>{audit.status}</span>
                  </td>
                  <td>
                    <ScoreText score={audit.overallScore} />
                  </td>
                  <td>{timeAgo(audit.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
