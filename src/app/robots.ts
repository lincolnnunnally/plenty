import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/account", "/sign-in", "/sign-out"] },
    sitemap: "https://plenty.unitedundergod.org/sitemap.xml",
  };
}
