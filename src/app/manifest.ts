import type { MetadataRoute } from "next";
import { appBaseUrl, appDescription, appName } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appName} - Website Audit Reports`,
    short_name: appName,
    description: appDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f8fb",
    theme_color: "#0f766e",
    categories: ["business", "productivity", "utilities"],
    id: appBaseUrl().toString(),
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
