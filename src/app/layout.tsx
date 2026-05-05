import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web Audit - Know What Is Broken. Fix What Matters.",
  description: "Audit performance, SEO, accessibility, security basics, and technical health in one clean report.",
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
