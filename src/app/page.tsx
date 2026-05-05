import Link from "next/link";
import { Activity, FileText, Globe2, Lock, ShieldCheck, TimerReset } from "lucide-react";
import { AddWebsiteForm } from "@/components/forms";
import { ThemeToggle } from "@/components/theme-toggle";
import { currentUser } from "@/lib/auth";
import { appBaseUrl, appDescription, appName } from "@/lib/seo";

export default async function HomePage() {
  const user = await currentUser();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: appName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: appBaseUrl().toString(),
    description: appDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="hero">
        <div className="hero-nav">
          <Link className="brand" href="/">
            <span className="brand-mark">
              <ShieldCheck size={18} />
            </span>
            <span>Web Audit</span>
          </Link>
          <div className="actions">
            <ThemeToggle />
            <Link className="button" href={user ? "/dashboard" : "/login"}>
              {user ? "Dashboard" : "Log in"}
            </Link>
          </div>
        </div>
        <div className="hero-inner">
          <div>
            <div className="badge">Page audit with selected website health checks</div>
            <h1>Know what is broken. Fix what matters.</h1>
            <p>
              Audit performance, SEO, accessibility, security basics, mobile readiness, and technical health in one
              clean report.
            </p>
            <div className="actions">
              <Link className="button primary" href={user ? "/dashboard" : "/signup"}>
                Run your first audit
              </Link>
              <Link className="button" href="/sample-report">
                View sample report
              </Link>
            </div>
          </div>
          <div className="report-preview">
            <div className="actions" style={{ justifyContent: "space-between" }}>
              <strong>codezela.com</strong>
              <span className="badge completed">Good</span>
            </div>
            <div style={{ margin: "24px 0" }}>
              <div className="big">82</div>
              <p className="muted">3 high priority issues. 14 passed checks.</p>
            </div>
            <div className="grid">
              {["Performance 76", "SEO 88", "Accessibility 84", "Security 71"].map((item) => (
                <div className="card" style={{ padding: 12 }} key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <section className="section">
        <div className="grid cols-3">
          {[
            [Activity, "Prioritised issues", "Clear severity, impact, evidence, and fixes."],
            [ShieldCheck, "Safe checks only", "SSRF-blocked, rate-limited, non-invasive audits."],
            [FileText, "Client-ready reports", "PDF export and private share links included."],
            [TimerReset, "Monitoring", "Daily, weekly, or monthly scheduled audits."],
            [Globe2, "Technical SEO", "Metadata, robots, sitemap, headings, and links."],
            [Lock, "Private by default", "Reports stay protected unless sharing is enabled."],
          ].map(([Icon, title, body]) => {
            const RealIcon = Icon as typeof Activity;
            return (
              <div className="card" key={String(title)}>
                <RealIcon size={22} />
                <h2>{String(title)}</h2>
                <p className="muted">{String(body)}</p>
              </div>
            );
          })}
        </div>
      </section>
      {user ? (
        <section className="section">
          <AddWebsiteForm />
        </section>
      ) : null}
    </>
  );
}
