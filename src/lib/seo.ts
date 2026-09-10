export const CITY = "Vidalia";
export const REGION = "Georgia";
export const PLACE = "Vidalia, Georgia";

export function pageMeta(title: string, description: string) {
  return {
    title,
    description,
    openGraph: { title: `${title} — Plenty`, description, type: "website" as const },
    twitter: { card: "summary_large_image" as const, title: `${title} — Plenty`, description }
  };
}

export const HOME_DESCRIPTION =
  "Plenty is a food pantry in Vidalia, Georgia. Free groceries for everyone — no income test. Come through the line or ask for a delivery. Volunteer or give. Stretch a dollar; share what you will not use.";
