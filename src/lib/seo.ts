import { LEGAL_NAME } from "@/lib/legal/org";

export const CITY = "Vidalia";
export const REGION = "Georgia";
export const PLACE = "Vidalia, Georgia";

// Canonical production host for search engines (not env-driven: previews must
// still point canonicals at the live site).
export const SITE_URL = "https://plenty.unitedundergod.org";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function absoluteUrl(path: string) {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

// `path` adds a canonical URL and og:url. Leave it off for private pages.
export function pageMeta(title: string, description: string, path?: string, opts: { absoluteTitle?: boolean } = {}) {
  const full = opts.absoluteTitle ? title : `${title} — Plenty`;
  return {
    title: opts.absoluteTitle ? { absolute: title } : title,
    description,
    ...(path ? { alternates: { canonical: absoluteUrl(path) } } : {}),
    openGraph: {
      title: full,
      description,
      type: "website" as const,
      siteName: "Plenty",
      locale: "en_US",
      ...(path ? { url: absoluteUrl(path) } : {})
    },
    twitter: { card: "summary_large_image" as const, title: full, description }
  };
}

export const HOME_DESCRIPTION =
  "Free groceries in Vidalia, Georgia, with no income test. Register once and come through the line, volunteer, or give food or money to the Plenty food pantry.";

const AREA_SERVED = {
  "@type": "City",
  name: CITY,
  containedInPlace: { "@type": "State", name: REGION }
} as const;

// Site-wide. No street address, hours or phone: those live in the pantry
// record and are shown only once a steward types the real thing.
export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Plenty",
  alternateName: "Plenty food pantry",
  url: SITE_URL,
  logo: absoluteUrl("/favicon.svg"),
  description: "Plenty is a food pantry in Vidalia, Georgia, and a program of United Under God, Inc., a 501(c)(3).",
  areaServed: AREA_SERVED,
  parentOrganization: { "@type": "NGO", name: LEGAL_NAME, url: "https://unitedundergod.org" }
} as const;

// One thing Plenty does. `free: true` only where the code makes it free.
export function serviceJsonLd(s: { name: string; description: string; path: string; serviceType: string; audience?: string; free?: boolean }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.description,
    serviceType: s.serviceType,
    url: absoluteUrl(s.path),
    provider: { "@id": ORGANIZATION_ID, "@type": "Organization", name: "Plenty", url: SITE_URL },
    areaServed: AREA_SERVED,
    ...(s.audience ? { audience: { "@type": "Audience", audienceType: s.audience } } : {}),
    ...(s.free ? { offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } } : {})
  };
}

export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
