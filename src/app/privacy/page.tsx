import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Privacy Policy",
  "How Web Audit stores account data, website URLs, audit reports, notifications, and private share links.",
  "/privacy",
);

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <nav className="legal-nav">
        <Link className="brand" href="/">
          <BrandMark />
          <span>Web Audit</span>
        </Link>
        <div className="actions">
          <ThemeToggle />
          <Link className="button" href="/signup">
            Start
          </Link>
        </div>
      </nav>
      <section className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="lead">Web Audit stores only the account and audit data needed to run reports, history, notifications, and private share links.</p>
        <div className="legal-grid">
          <article>
            <h2>Data We Store</h2>
            <p>Account profile details, hashed passwords, session hashes, submitted website URLs, audit results, findings, metrics, notifications, and share-link records.</p>
          </article>
          <article>
            <h2>Private By Default</h2>
            <p>Reports are visible only to the signed-in account owner unless a private share link is created. Shared reports expose only that selected audit.</p>
          </article>
          <article>
            <h2>Runtime Storage</h2>
            <p>The app can use local JSON for single-node operation or Postgres for shared runtime persistence. Treat either store as private operational state and back it up securely.</p>
          </article>
          <article>
            <h2>Deletion</h2>
            <p>Deleting a website removes its audits, findings, metrics, notifications, and share links. Deleting an account removes account-owned product data.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
