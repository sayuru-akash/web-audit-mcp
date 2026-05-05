import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web Audit - Know What Is Broken. Fix What Matters.",
  description: "Audit performance, SEO, accessibility, security basics, and technical health in one clean report.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
