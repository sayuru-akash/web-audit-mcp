import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NotFound() {
  return (
    <main className="state-page">
      <div className="state-card">
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <span className="brand-mark">
            <ShieldAlert size={18} />
          </span>
          <ThemeToggle />
        </div>
        <h1>Page not found</h1>
        <p className="muted">The page, report, or private share link you requested is unavailable.</p>
        <div className="actions">
          <Link className="button primary" href="/dashboard">
            Go to dashboard
          </Link>
          <Link className="button" href="/">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
