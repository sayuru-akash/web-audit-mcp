"use client";

import { RotateCcw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="state-page">
      <div className="state-card">
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <span className="brand-mark">!</span>
          <ThemeToggle />
        </div>
        <h1>Something went wrong</h1>
        <p className="muted">{error.message}</p>
        <button className="primary" onClick={reset}>
          <RotateCcw size={16} /> Try again
        </button>
      </div>
    </main>
  );
}
