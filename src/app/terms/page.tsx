import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TermsPage() {
  return (
    <main className="legal-page">
      <nav className="legal-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">W</span>
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
        <h1>Terms of Use</h1>
        <p className="lead">Web Audit performs safe, non-invasive checks on submitted public pages and presents automated first-pass reports.</p>
        <div className="legal-grid">
          <article>
            <h2>Authorized Use</h2>
            <p>Audit only websites you own, operate, or have permission to evaluate. Do not use the product for abusive traffic, probing private networks, or bypassing access controls.</p>
          </article>
          <article>
            <h2>Product Boundary</h2>
            <p>The audit is a page audit with selected website health checks. It is not penetration testing, vulnerability scanning, full crawling, legal advice, or accessibility certification.</p>
          </article>
          <article>
            <h2>Report Use</h2>
            <p>Reports are decision-support material. Validate important remediation work with manual review, browser testing, accessibility review, and production monitoring.</p>
          </article>
          <article>
            <h2>Operations</h2>
            <p>Keep secrets private, back up runtime data, and configure production storage, email, monitoring, and rate limits before high-scale multi-user operation.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
