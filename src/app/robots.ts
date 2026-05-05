import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/sample-report"],
      disallow: ["/dashboard", "/websites", "/audits", "/settings", "/notifications", "/admin", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
