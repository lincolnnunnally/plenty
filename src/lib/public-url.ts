export function plentyOrigin() {
  const fromEnv = (process.env.APP_PUBLIC_URL || process.env.AUTH_URL || "").trim().replace(/\/$/, "");
  if (fromEnv.startsWith("http")) return fromEnv;
  return "https://plenty.unitedundergod.org";
}

export function pantryPublicPath(slug: string) {
  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "vidalia";
  return `/p/${clean}`;
}

export function pantryPublicUrl(slug: string) {
  return `${plentyOrigin()}${pantryPublicPath(slug)}`;
}

export function pantryLinePath(slug: string) {
  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "vidalia";
  return `/line/${clean}`;
}

export function pantryLineUrl(slug: string) {
  return `${plentyOrigin()}${pantryLinePath(slug)}`;
}
