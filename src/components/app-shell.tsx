import Link from "next/link";
import { BarChart3, Bell, Globe2, LayoutDashboard, Settings } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import type { User } from "@/lib/types";
import { logoutAction } from "@/lib/actions";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/websites", label: "Websites", icon: Globe2 },
  { href: "/audits", label: "Audits", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ user, children, title, subtitle }: { user: User; children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <BrandMark />
          <span>Web Audit</span>
        </Link>
        <nav className="nav" aria-label="Main navigation">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href}>
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
          </div>
          <form action={logoutAction} className="actions">
            <span className="muted">{user.displayName}</span>
            <ThemeToggle />
            <button type="submit">Log out</button>
          </form>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
