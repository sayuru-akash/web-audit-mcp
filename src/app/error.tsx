"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="auth-page">
      <div className="card auth-card">
        <h1>Something went wrong</h1>
        <p className="muted">{error.message}</p>
        <button className="primary" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
