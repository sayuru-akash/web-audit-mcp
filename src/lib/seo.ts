import type { Metadata } from "next";

export const appName = "Web Audit";
export const appDescription =
  "Audit performance, SEO, accessibility, security basics, mobile readiness, and technical health in one clean report.";

export function appBaseUrl() {
  return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export function pageMetadata(title: string, description = appDescription, path = "/"): Metadata {
  const url = new URL(path, appBaseUrl());
  return {
    title,
    description,
    alternates: {
      canonical: url.toString(),
    },
    openGraph: {
      title,
      description,
      url: url.toString(),
      siteName: appName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
