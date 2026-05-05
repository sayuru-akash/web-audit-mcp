import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AddWebsiteForm, RunAuditButton } from "@/components/forms";
import { ScoreText } from "@/components/score";
import { requireUser } from "@/lib/auth";
import { getUserDashboard, latestAuditFor } from "@/lib/store";

export default async function WebsitesPage() {
  const user = await requireUser();
  const { websites, audits } = await getUserDashboard(user.id);
  return (
    <AppShell user={user} title="Websites" subtitle="Manage targets, schedules, and latest audit state.">
      <div className="grid cols-2">
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Website</th>
                <th>Latest score</th>
                <th>Schedule</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {websites.map((website) => {
                const latest = latestAuditFor(website, audits);
                return (
                  <tr key={website.id}>
                    <td>
                      <Link href={`/websites/${website.id}`}>
                        <strong>{website.displayName}</strong>
                        <div className="muted">{website.normalizedUrl}</div>
                      </Link>
                    </td>
                    <td>{latest ? <ScoreText score={latest.overallScore} /> : "No audit"}</td>
                    <td>{website.scheduleEnabled ? website.scheduleFrequency : "Manual"}</td>
                    <td>
                      <RunAuditButton websiteId={website.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <AddWebsiteForm />
      </div>
    </AppShell>
  );
}
