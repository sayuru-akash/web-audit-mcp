import type { Metadata } from "next";
import Script from "next/script";
import { appBaseUrl, appDescription, appName } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: appBaseUrl(),
  applicationName: appName,
  title: {
    default: "Web Audit - Know What Is Broken. Fix What Matters.",
    template: `%s | ${appName}`,
  },
  description: appDescription,
  keywords: [
    "website audit",
    "SEO audit",
    "accessibility audit",
    "security headers",
    "technical SEO",
    "website monitoring",
  ],
  authors: [{ name: "Web Audit" }],
  creator: "Web Audit",
  publisher: "Web Audit",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Web Audit - Know What Is Broken. Fix What Matters.",
    description: appDescription,
    url: "/",
    siteName: appName,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Audit - Know What Is Broken. Fix What Matters.",
    description: appDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "technology",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="web-audit-theme" strategy="beforeInteractive">
          {
            "try{var t=localStorage.getItem('web-audit-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}"
          }
        </Script>
        {children}
      </body>
    </html>
  );
}
