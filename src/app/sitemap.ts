import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://plenty.unitedundergod.org";
  return [
    "/",
    "/need-food",
    "/volunteer",
    "/visit",
    "/this-week",
    "/for-stores",
    "/donate",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));
}
