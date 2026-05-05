"use client";

import { Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuditStatusRefresh({ status }: { status: "queued" | "running" }) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 2500);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <section className="card audit-running" aria-live="polite">
      <div className="actions">
        <span className={`badge ${status}`}>{status}</span>
        <Activity size={18} />
      </div>
      <h2>{status === "queued" ? "Audit queued" : "Audit running"}</h2>
      <p className="muted">The page is being fetched, checked, scored, and classified. This report refreshes automatically.</p>
      <div className="progress-track" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
