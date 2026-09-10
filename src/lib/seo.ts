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
  "Free groceries in Vidalia, Georgia. No income test. Register, volunteer, or donate leftover food.";
