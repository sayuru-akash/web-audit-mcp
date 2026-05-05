import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-page">
      <div className="card auth-card">
        <h1>Page not found</h1>
        <p className="muted">The report or page you requested could not be found.</p>
        <Link className="button primary" href="/dashboard">Go to dashboard</Link>
      </div>
    </main>
  );
}
