export default function Loading() {
  return (
    <main className="auth-page">
      <div className="card auth-card loading-card">
        <div className="skeleton title-skeleton" />
        <div className="skeleton text-skeleton" />
        <div className="skeleton text-skeleton short" />
      </div>
    </main>
  );
}
