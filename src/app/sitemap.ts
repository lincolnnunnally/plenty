import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Public pages only. Signed-in, steward desk, household pass, store card and
// receipt pages stay out (they also send X-Robots-Tag: noindex, see next.config).
const ROUTES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/need-food", priority: 0.9 },
  { path: "/this-week", priority: 0.8 },
  { path: "/volunteer", priority: 0.8 },
  { path: "/donate", priority: 0.8 },
  { path: "/for-stores", priority: 0.8 },
  { path: "/around", priority: 0.7 },
  { path: "/become", priority: 0.6 },
  { path: "/tax-exempt", priority: 0.5 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, priority }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority,
  }));
}
