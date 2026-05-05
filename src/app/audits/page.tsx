import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { paginate, Pagination } from "@/components/pagination";
import { ScoreText } from "@/components/score";
import { requireUser } from "@/lib/auth";
import { getUserDashboard } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Audits",
  ...noIndexMetadata,
};

export default async function AuditsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const { audits, websites } = await getUserDashboard(user.id);
  const status = query.status && ["queued", "running", "completed", "failed", "cancelled"].includes(query.status) ? query.status : "";
  const filteredAudits = status ? audits.filter((audit) => audit.status === status) : audits;
  const page = Number(query.page ?? "1");
  const { currentPage, totalPages, pageItems, totalItems } = paginate(filteredAudits, Number.isFinite(page) ? page : 1, 10);
  return (
    <AppShell user={user} title="Audits" subtitle="Saved report history across every website.">
      <div className="list-toolbar">
        <div>
          <strong>{totalItems} report{totalItems === 1 ? "" : "s"}</strong>
          <p className="muted">Filter by status and page through longer audit history.</p>
        </div>
        <div className="segmented" aria-label="Audit status filter">
          {[
            ["", "All"],
            ["completed", "Completed"],
            ["failed", "Failed"],
            ["running", "Running"],
          ].map(([value, label]) => (
            <Link className={status === value ? "active" : ""} href={value ? `/audits?status=${value}` : "/audits"} key={value}>
              {label}
            </Link>
          ))}
        </div>
      </div>
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
            {pageItems.map((audit) => {
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
        {pageItems.length === 0 ? <div className="empty-state">No reports match this filter.</div> : null}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/audits" params={{ status }} />
    </AppShell>
  );
}
